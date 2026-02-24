import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import Account from '@/models/Account';
import Like from '@/models/Like';
import { createNotification } from '@/lib/notifications';
import { commentNeedsModeration } from '@/lib/moderation-bad-words';
import mongoose from 'mongoose';

/** Extrai handles únicos do texto (ex: @natrombellii @luigi → ['natrombellii', 'luigi']) */
function extractMentionHandles(content: string): string[] {
    const matches = content.match(/@([a-zA-Z0-9_.]+)/g);
    if (!matches) return [];
    const normalized = new Set<string>();
    for (const m of matches) {
        const handle = m.slice(1).toLowerCase().trim();
        if (handle.length > 0) normalized.add(handle);
    }
    return Array.from(normalized);
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Resolve handles (sem @) para account IDs. Usa link_instagram, link_tiktok, link_youtube (case-insensitive). */
async function resolveHandlesToAccountIds(handles: string[]): Promise<mongoose.Types.ObjectId[]> {
    const pairs = await resolveHandlesToMentionAccounts(handles);
    return pairs.map((p) => p.account_id);
}

/** Resolve handles para array { handle, account_id } (para guardar no comentário e linkar no perfil). */
async function resolveHandlesToMentionAccounts(
    handles: string[]
): Promise<{ handle: string; account_id: mongoose.Types.ObjectId }[]> {
    if (handles.length === 0) return [];
    const result: { handle: string; account_id: mongoose.Types.ObjectId }[] = [];
    const seenIds = new Set<string>();
    for (const h of handles) {
        const re = new RegExp('^' + escapeRegex(h) + '$', 'i');
        const account = await Account.findOne({
            $or: [
                { link_instagram: re },
                { link_tiktok: re },
                { link_youtube: re },
            ],
        })
            .select('_id')
            .lean();
        if (account) {
            const idStr = (account as { _id: mongoose.Types.ObjectId })._id.toString();
            if (!seenIds.has(idStr)) {
                seenIds.add(idStr);
                result.push({
                    handle: h.toLowerCase(),
                    account_id: (account as { _id: mongoose.Types.ObjectId })._id,
                });
            }
        }
    }
    return result;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Buscar comentários de um post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        await connectMongo();

        // Converter postId para ObjectId
        const postObjectId = new mongoose.Types.ObjectId(postId);

        // Verificar se o post existe
        const post = await Post.findById(postObjectId);
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Buscar conta do usuário logado (likes + se é moderador)
        let currentAccountId: mongoose.Types.ObjectId | null = null;
        let viewerIsModerator = false;
        const session = await auth();
        if (session?.user?.id) {
            const authUserId = (session.user as any).auth_user_id || session.user.id;
            const account = await Account.findOne({ auth_user_id: authUserId }).select('_id role').lean();
            if (account) {
                currentAccountId = account._id as mongoose.Types.ObjectId;
                viewerIsModerator = (account as { role?: string }).role === 'moderator' || (account as { role?: string }).role === 'admin';
            }
        }

        const moderationFilter = viewerIsModerator
            ? {}
            : { $or: [{ moderation_status: 'approved' }, { moderation_status: { $exists: false } }] };

        // Buscar comentários (apenas comentários de primeiro nível; ocultar pendentes para não-moderadores)
        const comments = await Comment.find({
            post_id: postObjectId,
            is_deleted: { $ne: true },
            ...moderationFilter,
            $or: [
                { parent_id: { $exists: false } },
                { parent_id: null }
            ]
        })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author_id', 'first_name last_name avatar_url')
            .lean();

        const total = await Comment.countDocuments({
            post_id: postObjectId,
            is_deleted: { $ne: true },
            ...moderationFilter,
            $or: [
                { parent_id: { $exists: false } },
                { parent_id: null }
            ]
        });

        // Buscar replies (ocultar pendentes para não-moderadores)
        const commentIds = comments.map((c: any) => c._id);
        const replies = await Comment.find({
            parent_id: { $in: commentIds },
            is_deleted: { $ne: true },
            ...moderationFilter,
        })
            .sort({ created_at: 1 })
            .populate('author_id', 'first_name last_name avatar_url')
            .lean();

        // Agrupar replies por parent_id
        const repliesByParent: Record<string, any[]> = {};
        replies.forEach((reply: any) => {
            const parentId = reply.parent_id.toString();
            if (!repliesByParent[parentId]) {
                repliesByParent[parentId] = [];
            }
            repliesByParent[parentId].push(reply);
        });

        // Buscar likes do usuário atual nos comentários e replies
        let userLikedComments: Set<string> = new Set();
        if (currentAccountId) {
            const allCommentIds = [
                ...comments.map((c: any) => c._id),
                ...replies.map((r: any) => r._id)
            ];
            const userLikes = await Like.find({
                user_id: currentAccountId,
                target_type: 'comment',
                target_id: { $in: allCommentIds },
            }).lean();
            userLikedComments = new Set(userLikes.map((l: any) => l.target_id.toString()));
        }

        function buildMentions(mentionAccounts: { handle: string; account_id: { toString: () => string } }[] | undefined): Record<string, string> {
            const out: Record<string, string> = {};
            (mentionAccounts || []).forEach((m) => {
                out[m.handle] = m.account_id.toString();
            });
            return out;
        }

        // Formatar comentários com replies
        const formattedComments = comments.map((comment: any) => {
            const author = comment.author_id;
            const commentReplies = repliesByParent[comment._id.toString()] || [];

            return {
                _id: comment._id.toString(),
                author: {
                    id: author?._id?.toString() || '',
                    name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                    avatar_url: author?.avatar_url || null,
                },
                content: comment.content,
                likes_count: comment.likes_count || 0,
                liked: userLikedComments.has(comment._id.toString()),
                replies_count: comment.replies_count || 0,
                created_at: comment.created_at,
                mentions: buildMentions(comment.mention_accounts),
                moderation_status: comment.moderation_status || 'approved',
                replies: commentReplies.map((reply: any) => {
                    const replyAuthor = reply.author_id;
                    return {
                        _id: reply._id.toString(),
                        author: {
                            id: replyAuthor?._id?.toString() || '',
                            name: replyAuthor ? `${replyAuthor.first_name || ''} ${replyAuthor.last_name || ''}`.trim() : 'Usuário',
                            avatar_url: replyAuthor?.avatar_url || null,
                        },
                        content: reply.content,
                        likes_count: reply.likes_count || 0,
                        liked: userLikedComments.has(reply._id.toString()),
                        created_at: reply.created_at,
                        mentions: buildMentions(reply.mention_accounts),
                        moderation_status: reply.moderation_status || 'approved',
                    };
                }),
            };
        });

        return NextResponse.json({
            comments: formattedComments,
            viewerIsModerator,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + comments.length < total,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Criar um novo comentário
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { postId } = await params;
        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        // Verificar se o post existe
        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Buscar account do usuário
        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const body = await request.json();
        const { content, parent_id } = body;

        if (!content?.trim()) {
            return NextResponse.json(
                { error: 'Comentário não pode estar vazio' },
                { status: 400 }
            );
        }

        const trimmedContent = content.trim();
        const mentionHandlesForSave = extractMentionHandles(trimmedContent);
        const mentionAccounts = mentionHandlesForSave.length > 0
            ? await resolveHandlesToMentionAccounts(mentionHandlesForSave)
            : [];

        const needsModeration = commentNeedsModeration(trimmedContent);
        const comment = new Comment({
            post_id: postId,
            author_id: account._id,
            content: trimmedContent,
            parent_id: parent_id || undefined,
            mention_accounts: mentionAccounts.length > 0 ? mentionAccounts : undefined,
            moderation_status: needsModeration ? 'pending' : 'approved',
        });

        await comment.save();

        // Incrementar contador de comentários no post
        await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });

        // Se for resposta, incrementar contador de replies no comentário pai
        if (parent_id) {
            await Comment.findByIdAndUpdate(parent_id, { $inc: { replies_count: 1 } });

            // Notificar o autor do comentário original (reply)
            const parentComment = await Comment.findById(parent_id);
            if (parentComment && parentComment.author_id.toString() !== account._id.toString()) {
                await createNotification({
                    recipientId: parentComment.author_id,
                    actorId: account._id,
                    type: 'reply',
                    postId: postId,
                    commentId: comment._id,
                    contentPreview: content.trim().slice(0, 100),
                });
            }
        } else {
            // Notificar o autor do post (comentário direto)
            if (post.author_id.toString() !== account._id.toString()) {
                await createNotification({
                    recipientId: post.author_id,
                    actorId: account._id,
                    type: 'comment',
                    postId: postId,
                    commentId: comment._id,
                    contentPreview: content.trim().slice(0, 100),
                });
            }
        }

        // Notificar usuários mencionados com @handle (arroba)
        if (mentionHandlesForSave.length > 0) {
            const mentionedAccountIds = mentionAccounts.map((m) => m.account_id);
            const authorIdStr = account._id.toString();
            const notifiedIds = new Set<string>();
            for (const recipientId of mentionedAccountIds) {
                const idStr = recipientId.toString();
                if (idStr === authorIdStr || notifiedIds.has(idStr)) continue;
                notifiedIds.add(idStr);
                await createNotification({
                    recipientId,
                    actorId: account._id,
                    type: 'mention',
                    postId: postId,
                    commentId: comment._id,
                    contentPreview: content.trim().slice(0, 100),
                });
            }
        }

        // Comentário pendente de moderação: notificar todos os moderadores
        if (needsModeration) {
            const moderators = await Account.find({ role: { $in: ['moderator', 'admin'] } })
                .select('_id')
                .lean();
            for (const mod of moderators) {
                const modId = (mod as { _id: mongoose.Types.ObjectId })._id;
                await createNotification({
                    recipientId: modId,
                    actorId: account._id,
                    type: 'moderation',
                    postId: postId,
                    commentId: comment._id,
                    contentPreview: trimmedContent.slice(0, 100),
                });
            }
        }

        // Popular author para retornar
        await comment.populate('author_id', 'first_name last_name avatar_url');

        const author = comment.author_id as any;
        const mentionsMap: Record<string, string> = {};
        (comment.mention_accounts || []).forEach((m: { handle: string; account_id: mongoose.Types.ObjectId }) => {
            mentionsMap[m.handle] = m.account_id.toString();
        });
        const formattedComment = {
            _id: comment._id.toString(),
            author: {
                id: author?._id?.toString() || '',
                name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                avatar_url: author?.avatar_url || null,
            },
            content: comment.content,
            likes_count: 0,
            replies_count: 0,
            created_at: comment.created_at,
            mentions: mentionsMap,
            moderation_status: comment.moderation_status || 'approved',
        };

        return NextResponse.json({
            success: true,
            comment: formattedComment,
        }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// PATCH - Editar um comentário (apenas o autor)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { postId } = await params;
        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');

        if (!commentId) {
            return NextResponse.json({ error: 'ID do comentário é obrigatório' }, { status: 400 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id role');
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
        }

        const body = await request.json();
        const { content, action } = body;

        const isModerator = (account as { role?: string }).role === 'moderator' || (account as { role?: string }).role === 'admin';

        if (action === 'approve') {
            if (!isModerator) {
                return NextResponse.json({ error: 'Sem permissão para aprovar comentários' }, { status: 403 });
            }
            comment.moderation_status = 'approved';
            await comment.save();
            await comment.populate('author_id', 'first_name last_name avatar_url');
            const author = comment.author_id as any;
            const mentionsMap: Record<string, string> = {};
            (comment.mention_accounts || []).forEach((m: { handle: string; account_id: mongoose.Types.ObjectId }) => {
                mentionsMap[m.handle] = m.account_id.toString();
            });
            return NextResponse.json({
                success: true,
                comment: {
                    _id: comment._id.toString(),
                    author: {
                        id: author?._id?.toString() || '',
                        name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                        avatar_url: author?.avatar_url || null,
                    },
                    content: comment.content,
                    likes_count: comment.likes_count || 0,
                    replies_count: comment.replies_count || 0,
                    created_at: comment.created_at,
                    mentions: mentionsMap,
                    moderation_status: 'approved',
                },
            });
        }

        if (comment.author_id.toString() !== account._id.toString()) {
            return NextResponse.json({ error: 'Sem permissão para editar este comentário' }, { status: 403 });
        }

        if (!content?.trim()) {
            return NextResponse.json(
                { error: 'Comentário não pode estar vazio' },
                { status: 400 }
            );
        }

        const trimmedContent = content.trim();
        const mentionHandlesForSave = extractMentionHandles(trimmedContent);
        const mentionAccounts = mentionHandlesForSave.length > 0
            ? await resolveHandlesToMentionAccounts(mentionHandlesForSave)
            : [];

        comment.content = trimmedContent;
        comment.mention_accounts = mentionAccounts.length > 0 ? mentionAccounts : [];
        comment.is_edited = true;
        comment.updated_at = new Date();
        await comment.save();

        await comment.populate('author_id', 'first_name last_name avatar_url');
        const author = comment.author_id as any;
        const mentionsMap: Record<string, string> = {};
        (comment.mention_accounts || []).forEach((m: { handle: string; account_id: mongoose.Types.ObjectId }) => {
            mentionsMap[m.handle] = m.account_id.toString();
        });

        return NextResponse.json({
            success: true,
            comment: {
                _id: comment._id.toString(),
                author: {
                    id: author?._id?.toString() || '',
                    name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                    avatar_url: author?.avatar_url || null,
                },
                content: comment.content,
                likes_count: comment.likes_count || 0,
                replies_count: comment.replies_count || 0,
                created_at: comment.created_at,
                mentions: mentionsMap,
            },
        });
    } catch (error) {
        console.error('Erro ao editar comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Deletar um comentário
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { postId } = await params;
        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');

        if (!commentId) {
            return NextResponse.json({ error: 'ID do comentário é obrigatório' }, { status: 400 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id role');
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
        }

        const isAuthor = comment.author_id.toString() === account._id.toString();
        const isModerator = (account as { role?: string }).role === 'moderator' || (account as { role?: string }).role === 'admin';
        if (!isAuthor && !isModerator) {
            return NextResponse.json({ error: 'Sem permissão para deletar este comentário' }, { status: 403 });
        }

        // Marcar como deletado (soft delete)
        comment.is_deleted = true;
        await comment.save();

        // Decrementar contador de comentários no post
        await Post.findByIdAndUpdate(postId, { $inc: { comments_count: -1 } });

        // Se for uma resposta, decrementar contador de replies no comentário pai
        if (comment.parent_id) {
            await Comment.findByIdAndUpdate(comment.parent_id, { $inc: { replies_count: -1 } });
        }

        return NextResponse.json({
            success: true,
            message: 'Comentário deletado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

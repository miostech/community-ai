import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import Post from '@/models/Post';
import SavedPost from '@/models/SavedPost';
import mongoose from 'mongoose';

// POST - Toggle salvar/dessalvar post
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

        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            return NextResponse.json({ error: 'Post ID inválido' }, { status: 400 });
        }

        await connectMongo();

        // Buscar conta do usuário usando auth_user_id
        const authUserId = (session.user as any).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).lean();

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const accountId = account._id as mongoose.Types.ObjectId;
        const postObjectId = new mongoose.Types.ObjectId(postId);

        // Verificar se o post existe
        const post = await Post.findById(postObjectId).lean();
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Verificar se já está salvo
        const existingSave = await SavedPost.findOne({
            account_id: accountId,
            post_id: postObjectId,
        }).lean();

        let saved: boolean;

        if (existingSave) {
            // Já está salvo - remover
            await SavedPost.deleteOne({
                account_id: accountId,
                post_id: postObjectId,
            });
            saved = false;
            console.log(`📤 Post ${postId} removido dos salvos por ${accountId}`);
        } else {
            // Não está salvo - adicionar
            await SavedPost.create({
                account_id: accountId,
                post_id: postObjectId,
            });
            saved = true;
            console.log(`📥 Post ${postId} salvo por ${accountId}`);
        }

        return NextResponse.json({
            success: true,
            saved,
        });
    } catch (error) {
        console.error('❌ Erro ao salvar/dessalvar post:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// GET - Verificar se o usuário salvou o post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { postId } = await params;

        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            return NextResponse.json({ error: 'Post ID inválido' }, { status: 400 });
        }

        await connectMongo();

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).lean();

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const accountId = account._id as mongoose.Types.ObjectId;
        const postObjectId = new mongoose.Types.ObjectId(postId);

        const existingSave = await SavedPost.findOne({
            account_id: accountId,
            post_id: postObjectId,
        }).lean();

        return NextResponse.json({
            saved: !!existingSave,
        });
    } catch (error) {
        console.error('❌ Erro ao verificar post salvo:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import ChatConversationModel from '@/models/ChatConversation';
import ChatMessageModel from '@/models/ChatMessage';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODERATOR_ROLES = new Set(['moderator', 'admin', 'criador']);

async function getSessionAccount() {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Não autorizado', status: 401 as const };

    const authUserId = (session.user as any).auth_user_id || session.user.id;
    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId });
    if (!account) return { error: 'Conta não encontrada', status: 404 as const };

    return { account };
}

export async function GET() {
    try {
        const result = await getSessionAccount();
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { account } = result;

        const conversations = await ChatConversationModel.find({
            kind: 'dm',
            status: 'active',
            participants: account._id,
        })
            .sort({ last_message_at: -1, updated_at: -1 })
            .lean();

        const mapped = await Promise.all(
            conversations.map(async (conv: any) => {
                const participantIds = (conv.participants || []).map((id: any) => id.toString());
                const otherId = participantIds.find((id: string) => id !== account._id.toString());
                const [otherAccount, lastMessage] = await Promise.all([
                    otherId
                        ? Account.findById(otherId)
                              .select('first_name last_name avatar_url role')
                              .lean()
                        : null,
                    ChatMessageModel.findOne({ conversation_id: conv._id })
                        .sort({ created_at: -1 })
                        .lean(),
                ]);
                const readState = (conv.read_states || []).find(
                    (state: any) => String(state.account_id) === account._id.toString()
                );
                const lastReadAt = readState?.last_read_at
                    ? new Date(readState.last_read_at)
                    : new Date(0);
                const unreadCount = await ChatMessageModel.countDocuments({
                    conversation_id: conv._id,
                    account_id: { $ne: account._id },
                    created_at: { $gt: lastReadAt },
                });

                return {
                    _id: conv._id,
                    title:
                        conv.title ||
                        `${otherAccount?.first_name || 'Usuário'} ${otherAccount?.last_name || ''}`.trim(),
                    other_participant: otherAccount
                        ? {
                              id: otherAccount._id.toString(),
                              first_name: otherAccount.first_name,
                              last_name: otherAccount.last_name,
                              avatar_url: otherAccount.avatar_url || null,
                              role: otherAccount.role || 'user',
                          }
                        : null,
                    last_message: lastMessage
                        ? {
                              id: lastMessage._id.toString(),
                              content: lastMessage.content,
                              created_at: lastMessage.created_at,
                              account_id: lastMessage.account_id.toString(),
                          }
                        : null,
                    last_message_at: conv.last_message_at || conv.updated_at || conv.created_at,
                    unread_count: unreadCount,
                    created_at: conv.created_at,
                    updated_at: conv.updated_at,
                };
            })
        );

        return NextResponse.json({ conversations: mapped });
    } catch (error: any) {
        console.error('Erro ao listar DMs:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const result = await getSessionAccount();
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { account } = result;

        if (!MODERATOR_ROLES.has(account.role || 'user')) {
            return NextResponse.json(
                { error: 'Somente moderadores podem iniciar mensagens privadas' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const targetAccountId = String(body?.target_account_id || '');
        const initialMessage = String(body?.message || '').trim();

        if (!targetAccountId || !mongoose.Types.ObjectId.isValid(targetAccountId)) {
            return NextResponse.json({ error: 'target_account_id inválido' }, { status: 400 });
        }
        if (targetAccountId === account._id.toString()) {
            return NextResponse.json(
                { error: 'Não é possível iniciar conversa com a própria conta' },
                { status: 400 }
            );
        }

        const targetAccount = await Account.findById(targetAccountId);
        if (!targetAccount) {
            return NextResponse.json({ error: 'Usuário alvo não encontrado' }, { status: 404 });
        }

        const participants = [account._id.toString(), targetAccount._id.toString()].sort();
        const conversationQuery = {
            kind: 'dm',
            participants: { $all: participants, $size: 2 },
            status: 'active',
        };

        let conversation = await ChatConversationModel.findOne(conversationQuery);
        if (!conversation) {
            conversation = await ChatConversationModel.create({
                account_id: account._id,
                kind: 'dm',
                participants,
                created_by: account._id,
                title: `${targetAccount.first_name} ${targetAccount.last_name || ''}`.trim(),
                model: 'dm',
                system_prompt: '',
                summary: '',
                last_message_at: new Date(),
                read_states: [
                    {
                        account_id: account._id,
                        last_read_at: new Date(),
                    },
                ],
            });
        }

        if (initialMessage) {
            const createdMessage = await ChatMessageModel.create({
                conversation_id: conversation._id,
                account_id: account._id,
                role: 'user',
                content: initialMessage,
            });

            conversation.last_message_at = createdMessage.created_at;
            const readStates = (conversation.read_states || []).map((state: any) =>
                String(state.account_id)
            );
            const myId = account._id.toString();
            const now = new Date();
            if (readStates.includes(myId)) {
                conversation.read_states = (conversation.read_states || []).map((state: any) =>
                    String(state.account_id) === myId
                        ? { ...state, last_read_at: now }
                        : state
                );
            } else {
                conversation.read_states = [
                    ...(conversation.read_states || []),
                    { account_id: account._id, last_read_at: now },
                ];
            }
            await conversation.save();

            await createNotification({
                recipientId: targetAccount._id,
                actorId: account._id,
                type: 'dm_new_message',
                conversationId: conversation._id,
                contentPreview: initialMessage,
            });
        }

        return NextResponse.json({
            conversation_id: conversation._id,
            created: true,
        });
    } catch (error: any) {
        console.error('Erro ao iniciar DM:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

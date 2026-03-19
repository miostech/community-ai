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

async function getSessionAccount() {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Não autorizado', status: 401 as const };

    const authUserId = (session.user as any).auth_user_id || session.user.id;
    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId });
    if (!account) return { error: 'Conta não encontrada', status: 404 as const };

    return { account };
}

async function getConversationForParticipant(conversationId: string, accountId: mongoose.Types.ObjectId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;
    return ChatConversationModel.findOne({
        _id: conversationId,
        kind: 'dm',
        status: 'active',
        participants: accountId,
    });
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const result = await getSessionAccount();
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { account } = result;
        const { conversationId } = await params;

        const conversation = await getConversationForParticipant(conversationId, account._id);
        if (!conversation) {
            return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
        }

        const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '40', 10)));
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            ChatMessageModel.find({ conversation_id: conversation._id })
                .sort({ created_at: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChatMessageModel.countDocuments({ conversation_id: conversation._id }),
        ]);

        const readStates = (conversation.read_states || []).map((state: any) => ({
            account_id: state.account_id.toString(),
            last_read_at: new Date(state.last_read_at || 0),
        }));
        const myReadIndex = readStates.findIndex(
            (state: any) => state.account_id === account._id.toString()
        );
        const now = new Date();
        if (myReadIndex >= 0) {
            conversation.read_states = (conversation.read_states || []).map((state: any) =>
                String(state.account_id) === account._id.toString()
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

        return NextResponse.json({
            conversation: {
                id: conversation._id,
                title: conversation.title,
                participants: (conversation.participants || []).map((id) => id.toString()),
                last_message_at: conversation.last_message_at,
                created_at: conversation.created_at,
            },
            messages: messages.map((m) => ({
                id: m._id.toString(),
                role: m.role,
                content: m.content,
                account_id: m.account_id.toString(),
                created_at: m.created_at,
            })),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Erro ao carregar mensagens DM:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const result = await getSessionAccount();
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { account } = result;
        const { conversationId } = await params;

        const conversation = await getConversationForParticipant(conversationId, account._id);
        if (!conversation) {
            return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
        }

        const body = await request.json();
        const message = String(body?.message || '').trim();
        if (!message) {
            return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
        }

        const createdMessage = await ChatMessageModel.create({
            conversation_id: conversation._id,
            account_id: account._id,
            role: 'user',
            content: message,
        });

        conversation.last_message_at = createdMessage.created_at;
        const readStates = (conversation.read_states || []).map((state: any) =>
            String(state.account_id)
        );
        const myId = account._id.toString();
        const now = new Date();
        if (readStates.includes(myId)) {
            conversation.read_states = (conversation.read_states || []).map((state: any) =>
                String(state.account_id) === myId ? { ...state, last_read_at: now } : state
            );
        } else {
            conversation.read_states = [
                ...(conversation.read_states || []),
                { account_id: account._id, last_read_at: now },
            ];
        }
        await conversation.save();

        const recipientId = (conversation.participants || []).find(
            (id) => id.toString() !== account._id.toString()
        );
        if (recipientId) {
            await createNotification({
                recipientId,
                actorId: account._id,
                type: 'dm_new_message',
                conversationId: conversation._id,
                contentPreview: message,
            });
        }

        return NextResponse.json({
            message: {
                id: createdMessage._id.toString(),
                role: createdMessage.role,
                content: createdMessage.content,
                account_id: createdMessage.account_id.toString(),
                created_at: createdMessage.created_at,
            },
        });
    } catch (error: any) {
        console.error('Erro ao enviar mensagem DM:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

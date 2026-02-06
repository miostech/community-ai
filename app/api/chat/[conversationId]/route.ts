import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import ChatConversationModel from '@/models/ChatConversation';
import ChatMessageModel from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET — Buscar mensagens de uma conversa (com paginação)
// ---------------------------------------------------------------------------
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { conversationId } = await params;
        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Verificar se a conversa pertence ao usuário
        const conversation = await ChatConversationModel.findOne({
            _id: conversationId,
            account_id: account._id,
        }).lean();

        if (!conversation) {
            return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
        }

        // Paginação via query params
        const url = new URL(_request.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '30', 10)));
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            ChatMessageModel.find({ conversation_id: conversationId })
                .sort({ created_at: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChatMessageModel.countDocuments({ conversation_id: conversationId }),
        ]);

        return NextResponse.json({
            conversation: {
                id: conversation._id,
                title: conversation.title,
                model: conversation.model,
                total_tokens_in: conversation.total_tokens_in,
                total_tokens_out: conversation.total_tokens_out,
                created_at: conversation.created_at,
            },
            messages: messages.map((m) => ({
                id: m._id,
                role: m.role,
                content: m.content,
                tokens_in: m.tokens_in,
                tokens_out: m.tokens_out,
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
        console.error('Erro ao buscar mensagens:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// ---------------------------------------------------------------------------
// DELETE — Arquivar conversa (soft delete)
// ---------------------------------------------------------------------------
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { conversationId } = await params;
        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const result = await ChatConversationModel.findOneAndUpdate(
            { _id: conversationId, account_id: account._id },
            { status: 'archived' },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Erro ao arquivar conversa:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

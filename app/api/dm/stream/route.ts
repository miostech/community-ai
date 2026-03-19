import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import ChatConversationModel from '@/models/ChatConversation';
import ChatMessageModel from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Snapshot = {
    conversations: Array<{ id: string; updatedAt: string }>;
    latestMessageId?: string | null;
};

async function getSessionAccountId() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const authUserId = (session.user as any).auth_user_id || session.user.id;
    await connectMongo();
    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    return account?._id?.toString() || null;
}

async function buildSnapshot(accountId: string, conversationId?: string): Promise<Snapshot> {
    const conversations = await ChatConversationModel.find({
        kind: 'dm',
        status: 'active',
        participants: accountId,
    })
        .sort({ last_message_at: -1, updated_at: -1 })
        .select('_id last_message_at updated_at')
        .lean();

    let latestMessageId: string | null = null;
    if (conversationId) {
        const latest = await ChatMessageModel.findOne({
            conversation_id: conversationId,
        })
            .sort({ created_at: -1 })
            .select('_id')
            .lean();
        latestMessageId = latest?._id?.toString() || null;
    }

    return {
        conversations: conversations.map((c: any) => ({
            id: c._id.toString(),
            updatedAt: (c.last_message_at || c.updated_at || new Date()).toISOString(),
        })),
        latestMessageId,
    };
}

export async function GET(request: NextRequest) {
    const accountId = await getSessionAccountId();
    if (!accountId) {
        return new Response('Não autorizado', { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get('conversation') || undefined;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let closed = false;
            let previous = '';

            const writeEvent = (event: string, data: unknown) => {
                controller.enqueue(
                    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
                );
            };

            const sendSnapshot = async () => {
                if (closed) return;
                const snapshot = await buildSnapshot(accountId, conversationId);
                const current = JSON.stringify(snapshot);
                if (current !== previous) {
                    previous = current;
                    writeEvent('update', snapshot);
                } else {
                    writeEvent('ping', { t: Date.now() });
                }
            };

            writeEvent('ready', { ok: true });
            await sendSnapshot();

            const interval = setInterval(() => {
                sendSnapshot().catch((error) => {
                    console.error('Erro no stream DM:', error);
                });
            }, 2000);

            request.signal.addEventListener('abort', () => {
                closed = true;
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}

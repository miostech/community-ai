import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CHAT_MESSAGES = 500;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ liveId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { liveId } = await params;
        if (!mongoose.Types.ObjectId.isValid(liveId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        await connectMongo();

        const event = await LiveEvent.findById(liveId)
            .select('chat_messages')
            .lean() as { chat_messages?: { sender: string; senderName: string; message: string; timestamp: number }[] } | null;

        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ messages: event.chat_messages || [] });
    } catch (error) {
        console.error('[api/lives/[liveId]/chat GET]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ liveId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { liveId } = await params;
        if (!mongoose.Types.ObjectId.isValid(liveId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const authUserId = (session.user as Record<string, unknown>).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id')
            .lean() as { _id: mongoose.Types.ObjectId } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
        }

        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const senderName = typeof body.senderName === 'string' ? body.senderName.trim() : '';
        if (!message || !senderName) {
            return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });
        }

        const chatMsg = {
            sender: account._id.toString(),
            senderName,
            message: message.slice(0, 500),
            timestamp: Date.now(),
        };

        await LiveEvent.updateOne(
            { _id: liveId },
            {
                $push: {
                    chat_messages: {
                        $each: [chatMsg],
                        $slice: -MAX_CHAT_MESSAGES,
                    },
                },
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[api/lives/[liveId]/chat POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

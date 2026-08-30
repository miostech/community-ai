import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { RoomServiceClient, EgressClient } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
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

        const authUserId = (session.user as Record<string, unknown>).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const endRoles = ['admin', 'moderator', 'criador'];
        if (event.creator_id.toString() !== account._id.toString() && !endRoles.includes(account.role || '')) {
            return NextResponse.json({ error: 'Sem permissão para encerrar esta live' }, { status: 403 });
        }

        if (event.status !== 'live') {
            return NextResponse.json({ error: 'Esta live não está ao vivo' }, { status: 400 });
        }

        event.status = 'ended';
        event.ended_at = new Date();
        await event.save();

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (apiKey && apiSecret && livekitUrl) {
            try {
                if (event.egress_id) {
                    const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
                    await egressClient.stopEgress(event.egress_id);
                }
            } catch (err) {
                console.error('[end] Erro ao parar gravação:', err);
            }
            try {
                const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
                await roomService.deleteRoom(event.room_name);
            } catch (err) {
                console.error('[end] Erro ao deletar sala no LiveKit:', err);
            }

            if (event.egress_id) {
                const azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
                const match = azureConnStr?.match(/AccountName=([^;]+)/);
                if (match) {
                    event.recording_url = `https://${match[1]}.blob.core.windows.net/ai-community-live-recordings/lives/${liveId}.mp4`;
                    await event.save();
                }
            }
        }

        return NextResponse.json({ success: true, event: event.toObject() });
    } catch (error) {
        console.error('[api/lives/[liveId]/end POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

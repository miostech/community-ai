import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { RoomServiceClient, EgressClient, EgressStatus } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function waitForEgressComplete(egressClient: EgressClient, egressId: string, maxWaitMs = 30000): Promise<boolean> {
    const start = Date.now();
    const interval = 2000;
    while (Date.now() - start < maxWaitMs) {
        await new Promise((r) => setTimeout(r, interval));
        try {
            const list = await egressClient.listEgress({ egressId });
            const egress = list[0];
            if (!egress) return false;
            if (egress.status === EgressStatus.EGRESS_COMPLETE) return true;
            if (egress.status === EgressStatus.EGRESS_FAILED || egress.status === EgressStatus.EGRESS_ABORTED) {
                console.error('[end] Egress falhou:', egress.status);
                return false;
            }
        } catch (err) {
            console.error('[end] Erro ao verificar egress:', err);
        }
    }
    console.warn('[end] Timeout esperando egress completar, salvando URL mesmo assim');
    return true;
}

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
            let egressOk = false;
            if (event.egress_id) {
                const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
                try {
                    await egressClient.stopEgress(event.egress_id);
                    egressOk = await waitForEgressComplete(egressClient, event.egress_id);
                } catch (err) {
                    console.error('[end] Erro ao parar gravação:', err);
                }

                if (egressOk) {
                    const azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
                    const match = azureConnStr?.match(/AccountName=([^;]+)/);
                    if (match) {
                        event.recording_url = `https://${match[1]}.blob.core.windows.net/ai-community-live-recordings/lives/${liveId}.mp4`;
                        await event.save();
                        console.log('[end] Recording URL salva:', event.recording_url);
                    } else {
                        console.error('[end] AZURE_STORAGE_CONNECTION_STRING sem AccountName');
                    }
                }
            } else {
                console.warn('[end] Live sem egress_id — gravação não disponível');
            }

            try {
                const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
                await roomService.deleteRoom(event.room_name);
            } catch (err) {
                console.error('[end] Erro ao deletar sala no LiveKit:', err);
            }
        }

        return NextResponse.json({ success: true, event: event.toObject() });
    } catch (error) {
        console.error('[api/lives/[liveId]/end POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

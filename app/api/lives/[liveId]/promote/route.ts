import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { RoomServiceClient, TrackSource } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        if (event.creator_id.toString() !== account._id.toString()) {
            return NextResponse.json({ error: 'Apenas o host pode promover participantes' }, { status: 403 });
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
        }

        const accountId = typeof body.accountId === 'string' ? body.accountId : '';
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return NextResponse.json({ error: 'accountId inválido' }, { status: 400 });
        }

        const alreadyPromoted = event.promoted_speakers?.some(
            (id) => id.toString() === accountId
        );

        if (!alreadyPromoted) {
            await LiveEvent.updateOne(
                { _id: liveId },
                { $addToSet: { promoted_speakers: new mongoose.Types.ObjectId(accountId) } }
            );
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (apiKey && apiSecret && livekitUrl && event.room_name) {
            try {
                const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
                await roomService.updateParticipant(event.room_name, accountId, undefined, {
                    canPublish: true,
                    canSubscribe: true,
                    canPublishData: true,
                });
            } catch (err) {
                console.error('[promote] Erro ao atualizar permissões no LiveKit:', err);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[api/lives/[liveId]/promote POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

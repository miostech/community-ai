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
            .select('_id role')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const staffRoles = ['moderator', 'admin', 'criador'];
        if (event.creator_id.toString() !== account._id.toString() && !staffRoles.includes(account.role || '')) {
            return NextResponse.json({ error: 'Sem permissão para remover permissão de fala' }, { status: 403 });
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

        await LiveEvent.updateOne(
            { _id: liveId },
            { $pull: { promoted_speakers: new mongoose.Types.ObjectId(accountId) } }
        );

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
                    canPublishSources: [TrackSource.CAMERA],
                });
            } catch (err) {
                console.error('[demote] Erro ao atualizar permissões no LiveKit:', err);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[api/lives/[liveId]/demote POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

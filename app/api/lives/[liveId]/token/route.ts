import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PARTICIPANTS = 500;
const MAX_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hora

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
            .select('_id first_name last_name avatar_url role subscription_active')
            .lean() as {
                _id: mongoose.Types.ObjectId;
                first_name?: string;
                last_name?: string;
                avatar_url?: string;
                role?: string;
                subscription_active?: boolean;
            } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        if (event.status === 'ended' || event.status === 'cancelled') {
            return NextResponse.json({ error: 'Esta live já foi encerrada' }, { status: 400 });
        }

        const isCreator = event.creator_id.toString() === account._id.toString();
        if (event.members_only && !account.subscription_active && !isCreator) {
            const staffRoles = ['moderator', 'admin', 'criador'];
            if (!staffRoles.includes(account.role || '')) {
                return NextResponse.json({ error: 'members_only' }, { status: 403 });
            }
        }

        if ((event as any).staff_only && !isCreator) {
            const staffRoles = ['moderator', 'admin', 'criador'];
            if (!staffRoles.includes(account.role || '')) {
                return NextResponse.json({ error: 'staff_only' }, { status: 403 });
            }
        }

        if (event.status === 'live' && event.started_at) {
            const elapsed = Date.now() - new Date(event.started_at).getTime();
            if (elapsed >= MAX_DURATION_MS) {
                event.status = 'ended';
                event.ended_at = new Date();
                await event.save();
                const ak = process.env.LIVEKIT_API_KEY;
                const as_ = process.env.LIVEKIT_API_SECRET;
                const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
                if (ak && as_ && url) {
                    try { await new RoomServiceClient(url, ak, as_).deleteRoom(event.room_name); } catch {}
                }
                return NextResponse.json({ error: 'Esta live atingiu o limite de 1 hora e foi encerrada automaticamente' }, { status: 400 });
            }
        }

        const staffRoles = ['moderator', 'admin', 'criador'];
        const isStaff = staffRoles.includes(account.role || '');

        let body: Record<string, unknown> = {};
        try { body = await _request.json(); } catch {}
        const joinAsViewer = body.joinAsViewer === true;

        const isHost = isCreator || (isStaff && !joinAsViewer);
        const isPromotedSpeaker = event.promoted_speakers?.some(
            (id) => id.toString() === account._id.toString()
        );

        const participantName = [account.first_name, account.last_name].filter(Boolean).join(' ').trim() || 'Participante';
        const participantIdentity = account._id.toString();

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!apiKey || !apiSecret || !livekitUrl) {
            return NextResponse.json(
                { error: 'LiveKit não configurado. Configure LIVEKIT_API_KEY, LIVEKIT_API_SECRET e NEXT_PUBLIC_LIVEKIT_URL.' },
                { status: 503 }
            );
        }

        if (!isHost && event.status === 'live') {
            try {
                const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
                const participants = await roomService.listParticipants(event.room_name);
                if (participants.length >= MAX_PARTICIPANTS) {
                    return NextResponse.json(
                        { error: `A live atingiu o limite de ${MAX_PARTICIPANTS} participantes` },
                        { status: 429 }
                    );
                }
            } catch {}
        }

        const token = new AccessToken(apiKey, apiSecret, {
            identity: participantIdentity,
            name: participantName,
            metadata: JSON.stringify({
                avatarUrl: account.avatar_url || '',
                role: account.role || 'user',
            }),
        });

        const isFullPublisher = isHost || isPromotedSpeaker || isStaff;

        token.addGrant({
            room: event.room_name,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            ...(isFullPublisher ? {} : { canPublishSources: [TrackSource.CAMERA] }),
        });

        token.ttl = '4h';

        const jwt = await token.toJwt();

        if (!isHost) {
            try {
                const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
                const currentParticipants = await roomService.listParticipants(event.room_name);
                const realCount = currentParticipants.length + 1;
                await LiveEvent.updateOne(
                    { _id: liveId },
                    {
                        $set: { viewer_count: realCount },
                        $addToSet: { unique_viewers: account._id },
                    }
                );
                await LiveEvent.updateOne(
                    { _id: liveId, max_viewer_count: { $lt: realCount } },
                    { $set: { max_viewer_count: realCount } }
                );
            } catch {}
        }

        return NextResponse.json({
            token: jwt,
            room_name: event.room_name,
            is_host: isHost,
            is_speaker: isPromotedSpeaker,
            can_publish_audio: isFullPublisher,
            livekit_url: livekitUrl,
        });
    } catch (error) {
        console.error('[api/lives/[liveId]/token POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

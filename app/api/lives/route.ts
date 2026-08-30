import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { RoomServiceClient } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';
import Post from '@/models/Post';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIVE_CREATOR_ROLES = ['moderator', 'admin', 'criador'];

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const reqAccount = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string } | null;

        const staffRoles = ['moderator', 'admin', 'criador'];
        const isStaff = reqAccount && staffRoles.includes(reqAccount.role || '');

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;
        if (!isStaff) {
            filter.staff_only = { $ne: true };
        }

        const [events, total] = await Promise.all([
            LiveEvent.find(filter)
                .sort({ status: 1, started_at: -1, scheduled_at: 1, created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            LiveEvent.countDocuments(filter),
        ]);

        const creatorIds = [...new Set(events.map((e) => e.creator_id.toString()))];
        const creators = await Account.find({ _id: { $in: creatorIds } })
            .select('_id first_name last_name avatar_url role')
            .lean();
        const creatorsMap = new Map(creators.map((c) => [c._id.toString(), c]));

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

        const liveEvents = events.filter((e) => e.status === 'live' && (e as any).room_name);
        const realCounts = new Map<string, number>();

        if (apiKey && apiSecret && livekitUrl && liveEvents.length > 0) {
            const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
            await Promise.all(
                liveEvents.map(async (e) => {
                    try {
                        const participants = await roomService.listParticipants((e as any).room_name);
                        realCounts.set(e._id.toString(), participants.length);
                    } catch {}
                })
            );
        }

        const formatted = events.map((e) => {
            const creator = creatorsMap.get(e.creator_id.toString());
            const { reservations, unique_viewers, ...rest } = e as any;
            const realCount = realCounts.get(e._id.toString());
            return {
                ...rest,
                viewer_count: realCount ?? (e as any).viewer_count ?? 0,
                total_viewers: Array.isArray(unique_viewers) ? unique_viewers.length : 0,
                reservations_count: Array.isArray(reservations) ? reservations.length : 0,
                creator: creator
                    ? {
                          _id: creator._id,
                          first_name: (creator as any).first_name,
                          last_name: (creator as any).last_name,
                          avatar_url: (creator as any).avatar_url,
                          role: (creator as any).role,
                      }
                    : null,
            };
        });

        return NextResponse.json({
            events: formatted,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('[api/lives GET]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const accRole = (account as any).role as string | undefined;
        if (!LIVE_CREATOR_ROLES.includes(accRole || '')) {
            return NextResponse.json(
                { error: 'Apenas moderadores, admins e criadores podem criar lives' },
                { status: 403 }
            );
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
        }

        const title = typeof body.title === 'string' ? body.title.trim() : '';
        if (!title || title.length > 200) {
            return NextResponse.json(
                { error: 'Título é obrigatório e deve ter no máximo 200 caracteres' },
                { status: 400 }
            );
        }

        const description = typeof body.description === 'string' ? body.description.trim() : undefined;
        const cover_image_url = typeof body.cover_image_url === 'string' ? body.cover_image_url.trim() : undefined;
        const scheduled_at = typeof body.scheduled_at === 'string' ? new Date(body.scheduled_at) : undefined;
        const members_only = body.members_only === true;
        const staff_only = body.staff_only === true;

        const roomId = new mongoose.Types.ObjectId();

        let slug = title
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 80);
        const existingSlug = await LiveEvent.findOne({ slug }).select('_id').lean();
        if (existingSlug) {
            slug = `${slug}-${roomId.toString().slice(-6)}`;
        }

        const liveEvent = new LiveEvent({
            _id: roomId,
            title,
            slug,
            description,
            cover_image_url,
            creator_id: (account as any)._id,
            room_name: `live-${roomId.toString()}`,
            status: 'scheduled',
            scheduled_at,
            members_only,
            staff_only,
        });

        await liveEvent.save();

        if (!staff_only) {
            // O horário NÃO é embutido no texto do post: seria formatado no fuso do
            // servidor (UTC) e ficaria errado para todo mundo. O card de live exibe
            // scheduled_at no fuso de cada leitor.
            const postContent = `‼️ **${title}**\n\n${description || 'Não perca! Reserve seu lugar e seja notificado quando a live começar.'}`;

            const post = new Post({
                author_id: (account as any)._id,
                content: postContent,
                category: 'atualizacao',
                media_type: cover_image_url ? 'image' : 'text',
                images: cover_image_url ? [cover_image_url] : [],
                status: 'published',
                visibility: 'public',
                is_approved: true,
                live_event_id: roomId,
                published_at: new Date(),
            });
            await post.save();
        }

        return NextResponse.json({ success: true, event: liveEvent.toObject() }, { status: 201 });
    } catch (error) {
        console.error('[api/lives POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

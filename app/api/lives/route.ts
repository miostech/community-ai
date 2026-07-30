import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

        await connectMongo();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

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

        const formatted = events.map((e) => {
            const creator = creatorsMap.get(e.creator_id.toString());
            const { reservations, ...rest } = e as any;
            return {
                ...rest,
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

        const roomId = new mongoose.Types.ObjectId();
        const liveEvent = new LiveEvent({
            _id: roomId,
            title,
            description,
            cover_image_url,
            creator_id: (account as any)._id,
            room_name: `live-${roomId.toString()}`,
            status: 'scheduled',
            scheduled_at,
            members_only,
        });

        await liveEvent.save();

        const scheduledLabel = scheduled_at
            ? ` em ${new Date(scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
            : '';
        const postContent = `‼️ **${title}**${scheduledLabel}\n\n${description || 'Não perca! Reserve seu lugar e seja notificado quando a live começar.'}`;

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

        return NextResponse.json({ success: true, event: liveEvent.toObject() }, { status: 201 });
    } catch (error) {
        console.error('[api/lives POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

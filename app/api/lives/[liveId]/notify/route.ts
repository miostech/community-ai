import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';
import Post from '@/models/Post';
import { createNotification } from '@/lib/notifications';

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

        const allowedRoles = ['moderator', 'admin', 'criador'];
        if (!allowedRoles.includes(account.role || '')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const event = await LiveEvent.findById(liveId).lean() as {
            _id: mongoose.Types.ObjectId;
            title?: string;
            status?: string;
            slug?: string;
            staff_only?: boolean;
        } | null;
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        if (event.staff_only) {
            return NextResponse.json({ error: 'Lives de staff não podem ser notificadas' }, { status: 400 });
        }

        const recipients = await Account.find({ _id: { $ne: account._id } })
            .select('_id')
            .lean() as { _id: mongoose.Types.ObjectId }[];

        const contentPreview = event.title?.slice(0, 150) || 'Nova live';
        const notificationType = event.status === 'live' ? 'live_started' : 'live_scheduled';
        for (const rec of recipients) {
            createNotification({
                recipientId: rec._id,
                actorId: account._id,
                type: notificationType,
                liveEventId: new mongoose.Types.ObjectId(liveId),
                contentPreview,
            }).catch((err) => console.error('[live notify]', err));
        }

        const isLive = event.status === 'live';
        const postContent = isLive
            ? `🔴 Estamos ao vivo! "${event.title}" — entre agora e participe!`
            : `📅 "${event.title}" — nova live agendada! Não perca!`;

        const existingPost = await Post.findOne({ live_event_id: new mongoose.Types.ObjectId(liveId) }).select('_id').lean();
        if (!existingPost) {
            await Post.create({
                author_id: account._id,
                content: postContent,
                category: 'atualizacao',
                media_type: 'text',
                visibility: 'members',
                status: 'published',
                published_at: new Date(),
                live_event_id: new mongoose.Types.ObjectId(liveId),
            });
        }

        return NextResponse.json({ success: true, notified: recipients.length });
    } catch (error) {
        console.error('[api/lives/[liveId]/notify POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

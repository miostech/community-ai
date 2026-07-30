import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';
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

        const event = await LiveEvent.findById(liveId).lean();
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const recipients = await Account.find({ _id: { $ne: account._id } })
            .select('_id')
            .lean() as { _id: mongoose.Types.ObjectId }[];

        const contentPreview = (event as any).title?.slice(0, 150) || 'Nova live';
        for (const rec of recipients) {
            createNotification({
                recipientId: rec._id,
                actorId: account._id,
                type: 'live_scheduled',
                liveEventId: new mongoose.Types.ObjectId(liveId),
                contentPreview,
            }).catch((err) => console.error('[live notify]', err));
        }

        return NextResponse.json({ success: true, notified: recipients.length });
    } catch (error) {
        console.error('[api/lives/[liveId]/notify POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

        const allowedRoles = ['admin', 'moderator', 'criador'];
        const isCreator = event.creator_id.toString() === account._id.toString();
        if (!isCreator && !allowedRoles.includes(account.role || '')) {
            return NextResponse.json({ error: 'Sem permissão para reabrir esta live' }, { status: 403 });
        }

        if (event.status !== 'ended' && event.status !== 'cancelled') {
            return NextResponse.json({ error: 'Apenas lives encerradas podem ser reabertas' }, { status: 400 });
        }

        event.status = 'scheduled';
        event.started_at = undefined;
        event.ended_at = undefined;
        event.egress_id = undefined;
        event.viewer_count = 0;
        event.max_viewer_count = 0;
        await event.save();

        return NextResponse.json({ success: true, event: event.toObject() });
    } catch (error) {
        console.error('[api/lives/[liveId]/reopen POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

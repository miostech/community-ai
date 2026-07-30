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
            .select('_id role subscription_active')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string; subscription_active?: boolean } | null;

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

        if (event.members_only && !account.subscription_active) {
            const staffRoles = ['moderator', 'admin', 'criador'];
            if (!staffRoles.includes(account.role || '')) {
                return NextResponse.json({ error: 'members_only' }, { status: 403 });
            }
        }

        if (!event.reservations) event.reservations = [] as any;

        const alreadyReserved = event.reservations.some(
            (id) => id.toString() === account._id.toString()
        );

        if (alreadyReserved) {
            return NextResponse.json({ reserved: true, count: event.reservations.length });
        }

        event.reservations.push(account._id);
        await event.save();

        return NextResponse.json({ reserved: true, count: event.reservations.length });
    } catch (error) {
        console.error('[api/lives/[liveId]/reserve POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function DELETE(
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
            .select('_id')
            .lean() as { _id: mongoose.Types.ObjectId } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        if (!event.reservations) event.reservations = [] as any;
        event.reservations = (event.reservations || []).filter(
            (id) => id.toString() !== account._id.toString()
        ) as mongoose.Types.Array<mongoose.Types.ObjectId>;
        await event.save();

        return NextResponse.json({ reserved: false, count: event.reservations.length });
    } catch (error) {
        console.error('[api/lives/[liveId]/reserve DELETE]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

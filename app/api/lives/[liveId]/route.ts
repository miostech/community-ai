import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
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

        await connectMongo();

        const event = await LiveEvent.findById(liveId).lean();
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const creator = await Account.findById(event.creator_id)
            .select('_id first_name last_name avatar_url role')
            .lean();

        return NextResponse.json({
            event: {
                ...event,
                creator: creator
                    ? {
                          _id: creator._id,
                          first_name: (creator as any).first_name,
                          last_name: (creator as any).last_name,
                          avatar_url: (creator as any).avatar_url,
                          role: (creator as any).role,
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error('[api/lives/[liveId] GET]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function PATCH(
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

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const accId = (account as any)._id as mongoose.Types.ObjectId;
        const accRole = (account as any).role as string | undefined;
        if (event.creator_id.toString() !== accId.toString() && accRole !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão para editar esta live' }, { status: 403 });
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
        }

        if (typeof body.title === 'string') event.title = body.title.trim();
        if (typeof body.description === 'string') event.description = body.description.trim();
        if (typeof body.cover_image_url === 'string') event.cover_image_url = body.cover_image_url.trim();
        if (typeof body.scheduled_at === 'string') event.scheduled_at = new Date(body.scheduled_at);

        await event.save();

        return NextResponse.json({ success: true, event: event.toObject() });
    } catch (error) {
        console.error('[api/lives/[liveId] PATCH]', error);
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

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const accId = (account as any)._id as mongoose.Types.ObjectId;
        const accRole = (account as any).role as string | undefined;
        if (event.creator_id.toString() !== accId.toString() && accRole !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão para deletar esta live' }, { status: 403 });
        }

        event.status = 'cancelled';
        await event.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[api/lives/[liveId] DELETE]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

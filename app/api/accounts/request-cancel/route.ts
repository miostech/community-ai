import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

        const account = await Account.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: { request_cancel_at: new Date() } },
            { new: true }
        );

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const actorId = account._id as mongoose.Types.ObjectId;
        const moderatorAccounts = await Account.find({
            role: { $in: ['moderator', 'admin'] },
            _id: { $ne: actorId },
        })
            .select('_id')
            .lean();

        const contentPreview = 'Solicitou o cancelamento da assinatura';
        for (const mod of moderatorAccounts) {
            const recipientId = mod._id as mongoose.Types.ObjectId;
            await createNotification({
                recipientId,
                actorId,
                type: 'subscription_cancel_request',
                contentPreview,
            });
        }

        const request_cancel_at = account.request_cancel_at
            ? new Date(account.request_cancel_at).toISOString()
            : null;

        return NextResponse.json({
            success: true,
            message: 'Pedido de cancelamento registrado',
            request_cancel_at,
        });
    } catch (error) {
        console.error('Erro ao registrar pedido de cancelamento:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

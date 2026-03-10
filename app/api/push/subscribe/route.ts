import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import PushSubscription from '@/models/PushSubscription';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface SubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: SubscriptionKeys;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const body = (await request.json()) as SubscriptionPayload;
    const { endpoint, expirationTime, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Payload inválido: endpoint e keys (p256dh, auth) são obrigatórios' },
        { status: 400 }
      );
    }

    const accountId = account._id as mongoose.Types.ObjectId;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    await PushSubscription.findOneAndUpdate(
      { account_id: accountId, endpoint },
      {
        $set: {
          expiration_time: expirationTime ?? null,
          keys: { p256dh: keys.p256dh, auth: keys.auth },
          user_agent: userAgent,
          updated_at: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar push subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : null;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Campo endpoint é obrigatório' },
        { status: 400 }
      );
    }

    const accountId = account._id as mongoose.Types.ObjectId;
    const result = await PushSubscription.deleteOne({
      account_id: accountId,
      endpoint,
    });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount > 0,
    });
  } catch (error) {
    console.error('Erro ao remover push subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

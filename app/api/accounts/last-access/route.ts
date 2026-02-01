import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.auth_user_id) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        await connectMongo();

        await Account.updateOne(
            { auth_user_id: session.user.auth_user_id },
            { $set: { last_access_at: new Date() } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar last_access_at:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

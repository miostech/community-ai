import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE = 'marca_signup_intent';

export async function POST() {
    try {
        const session = await auth();
        const authUserId = (session?.user as { auth_user_id?: string } | undefined)?.auth_user_id;
        if (!authUserId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const store = await cookies();
        if (store.get(COOKIE)?.value !== '1') {
            return NextResponse.json({ ok: false, claimed: false });
        }

        await connectMongo();
        const account = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const role = account.role || 'user';
        if (role === 'admin' || role === 'moderator' || role === 'criador') {
            store.delete(COOKIE);
            return NextResponse.json({ ok: false, claimed: false, reason: 'existing_role' });
        }
        if (role === 'marca') {
            store.delete(COOKIE);
            return NextResponse.json({ ok: false, claimed: false, reason: 'already_marca' });
        }

        await Account.updateOne({ auth_user_id: authUserId }, { $set: { role: 'marca' } });
        store.delete(COOKIE);

        return NextResponse.json({ ok: true, claimed: true });
    } catch (e) {
        console.error('marca/claim-oauth:', e);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

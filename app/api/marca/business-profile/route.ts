import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import BusinessAccount from '@/models/BusinessAccount';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MARCA_ROLES = new Set(['marca', 'moderator', 'admin']);

type SessionOk = { account: { _id: { toString(): string }; role?: string } };

async function getAccountFromSession(): Promise<SessionOk | NextResponse> {
    const session = await auth();
    const authUserId = (session?.user as { auth_user_id?: string } | undefined)?.auth_user_id || session?.user?.id;
    if (!authUserId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    await connectMongo();
    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id role').lean();
    if (!account) {
        return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }
    if (!MARCA_ROLES.has(account.role || 'user')) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    return { account: account as SessionOk['account'] };
}

export async function GET() {
    try {
        const ctx = await getAccountFromSession();
        if (ctx instanceof NextResponse) return ctx;

        const biz = await BusinessAccount.findOne({ account_id: ctx.account._id }).lean();

        return NextResponse.json({
            success: true,
            profile: {
                brand_logo_url: biz?.brand_logo_url ?? null,
                brand_description: biz?.brand_description ?? null,
                wallet_balance_cents: typeof biz?.wallet_balance_cents === 'number' ? biz.wallet_balance_cents : 0,
            },
        });
    } catch (e) {
        console.error('GET business-profile:', e);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const ctx = await getAccountFromSession();
        if (ctx instanceof NextResponse) return ctx;

        const body = await request.json();
        const brand_logo_url =
            typeof body.brand_logo_url === 'string' ? body.brand_logo_url.trim() : undefined;
        const brand_description =
            typeof body.brand_description === 'string' ? body.brand_description.trim() : undefined;

        if (brand_logo_url === undefined && brand_description === undefined) {
            return NextResponse.json({ error: 'Informe brand_logo_url e/ou brand_description.' }, { status: 400 });
        }

        if (brand_description !== undefined && brand_description.length > 1000) {
            return NextResponse.json({ error: 'Descrição: máximo 1000 caracteres.' }, { status: 400 });
        }

        const set: Record<string, unknown> = {};
        if (brand_logo_url !== undefined) set.brand_logo_url = brand_logo_url || null;
        if (brand_description !== undefined) set.brand_description = brand_description || null;

        const updated = await BusinessAccount.findOneAndUpdate(
            { account_id: ctx.account._id },
            { $set: set },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        ).lean();

        return NextResponse.json({
            success: true,
            profile: {
                brand_logo_url: updated?.brand_logo_url ?? null,
                brand_description: updated?.brand_description ?? null,
                wallet_balance_cents: typeof updated?.wallet_balance_cents === 'number' ? updated.wallet_balance_cents : 0,
            },
        });
    } catch (e) {
        console.error('PATCH business-profile:', e);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

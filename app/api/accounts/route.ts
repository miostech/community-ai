import { NextRequest, NextResponse } from 'next/server';

import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value as string);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function toNumber(value: unknown, fallback = 0): number {
    if (value === undefined || value === null) return fallback;
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { auth_user_id, first_name, last_name } = body;

        if (!auth_user_id) {
            return NextResponse.json({ error: 'auth_user_id é obrigatório' }, { status: 400 });
        }

        await connectMongo();

        const totalTokensWeekInput =
            body.total_tokens_used_current_week ?? body.total_token_used_current_week;

        const payload = {
            first_name,
            last_name,
            auth_user_id,
            link_instagram: body.link_instagram,
            link_tiktok: body.link_tiktok,
            avatar_url: body.avatar_url,
            background_url: body.background_url,
            code_invite: body.code_invite,
            code_invite_ref: body.code_invite_ref,
            plan: body.plan ?? 'free',
            plan_expire_at: toDate(body.plan_expire_at),
            total_tokens_used: toNumber(body.total_tokens_used),
            total_tokens_used_in_current_month: toNumber(body.total_tokens_used_in_current_month),
            total_tokens_used_current_week: toNumber(totalTokensWeekInput),
            utm_ref: body.utm_ref,
            last_access_at: toDate(body.last_access_at) ?? new Date(),
        };

        const account = await Account.findOneAndUpdate(
            { auth_user_id },
            { $set: payload },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        if (!account) {
            return NextResponse.json({ error: 'Não foi possível salvar a conta' }, { status: 500 });
        }

        const { _id, ...rest } = account.toObject({ versionKey: false });

        return NextResponse.json({ id: _id.toString(), ...rest }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar/atualizar conta', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

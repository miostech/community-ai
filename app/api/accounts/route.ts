import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
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

// GET - Buscar dados do usuário autenticado
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        // Usar auth_user_id se disponível, senão usar id
        const authUserId = (session.user as any).auth_user_id || session.user.id;
        console.log('🔍 Buscando conta com auth_user_id:', authUserId);

        const account = await Account.findOne({ auth_user_id: authUserId });

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            account: {
                id: account._id.toString(),
                first_name: account.first_name,
                last_name: account.last_name,
                email: account.email || session.user.email,
                phone: account.phone,
                phone_country_code: account.phone_country_code || '+55',
                link_instagram: account.link_instagram,
                link_tiktok: account.link_tiktok,
                link_youtube: account.link_youtube,
                primary_social_link: account.primary_social_link,
                avatar_url: account.avatar_url || session.user.image,
                background_url: account.background_url,
                plan: account.plan,
                code_invite: account.code_invite,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar conta:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// PATCH - Atualizar dados do usuário autenticado
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        // Campos permitidos para atualização
        const allowedFields = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'phone_country_code',
            'link_instagram',
            'link_tiktok',
            'link_youtube',
            'primary_social_link',
            'avatar_url',
            'background_url',
        ];

        // Filtrar apenas campos permitidos
        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }

        await connectMongo();

        // Usar auth_user_id se disponível, senão usar id
        const authUserId = (session.user as any).auth_user_id || session.user.id;

        const account = await Account.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            account: {
                id: account._id.toString(),
                first_name: account.first_name,
                last_name: account.last_name,
                email: account.email,
                phone: account.phone,
                phone_country_code: account.phone_country_code,
                link_instagram: account.link_instagram,
                link_tiktok: account.link_tiktok,
                link_youtube: account.link_youtube,
                primary_social_link: account.primary_social_link,
                avatar_url: account.avatar_url,
                background_url: account.background_url,
                plan: account.plan,
            },
        });
    } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

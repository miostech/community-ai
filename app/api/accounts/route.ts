import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';

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
            link_youtube: body.link_youtube,
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

        const account = await Account.findOne({ auth_user_id: authUserId }).lean();

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Busca o último pagamento aprovado do usuário
        const email = (account as any).email || session.user.email;
        const lastPayment = await AccountPayment.findOne({
            email: email?.toLowerCase().trim(),
            webhook_event_type: { $in: ['order_approved', 'paid', 'subscription_renewed'] }
        }).sort({ createdAt: -1 }).lean();

        // Determina o status da assinatura
        let subscriptionStatus: 'active' | 'expired' | 'inactive' = 'inactive';
        let subscriptionExpiresAt: Date | null = null;

        if (lastPayment) {
            const payment = lastPayment as any;

            // Se tem dados de assinatura com próximo pagamento
            if (payment.subscription?.next_payment) {
                subscriptionExpiresAt = new Date(payment.subscription.next_payment);
                subscriptionStatus = subscriptionExpiresAt > new Date() ? 'active' : 'expired';
            }
            // Se é uma compra única aprovada (sem subscription), considera ativo
            // Produtos do tipo "payment" ou "membership" são compras únicas
            else if (
                payment.order_status === 'paid' &&
                ['order_approved', 'paid'].includes(payment.webhook_event_type)
            ) {
                // Compra única - ativo enquanto não houver reembolso
                subscriptionStatus = 'active';
                // Para compras únicas, não tem data de expiração
                subscriptionExpiresAt = null;
            }
        }

        const acc = account as unknown as { _id: unknown; used_instagram_avatar?: boolean; instagram_avatar_used_at?: Date | string; [k: string]: unknown };
        const payment = lastPayment as any;

        return NextResponse.json({
            success: true,
            account: {
                id: acc._id?.toString?.() ?? String(acc._id),
                first_name: acc.first_name,
                last_name: acc.last_name,
                email: acc.email || session.user.email,
                phone: acc.phone,
                phone_country_code: acc.phone_country_code || '+55',
                link_instagram: acc.link_instagram,
                link_tiktok: acc.link_tiktok,
                link_youtube: acc.link_youtube,
                primary_social_link: acc.primary_social_link,
                avatar_url: acc.avatar_url || session.user.image,
                used_instagram_avatar: acc.used_instagram_avatar === true,
                instagram_avatar_used_at: acc.instagram_avatar_used_at
                    ? (typeof acc.instagram_avatar_used_at === 'string'
                        ? acc.instagram_avatar_used_at
                        : new Date(acc.instagram_avatar_used_at as Date).toISOString())
                    : null,
                background_url: acc.background_url,
                plan: acc.plan,
                code_invite: acc.code_invite,
            },
            subscription: {
                status: subscriptionStatus,
                expires_at: subscriptionExpiresAt,
                product_name: payment?.product_name || null,
                last_payment_at: payment?.createdAt || null,
                payment_method: payment?.payment_method || null,
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

        // Garantir que a resposta inclua os valores que acabamos de salvar (evita perda se o modelo estiver em cache sem o campo)
        const accountData = account.toObject ? account.toObject() : { ...account };
        const responseAccount = {
            id: (accountData as any).id ?? (account as any)._id?.toString?.(),
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            phone: account.phone,
            phone_country_code: account.phone_country_code,
            link_instagram: updateData.link_instagram !== undefined ? updateData.link_instagram : (accountData as any).link_instagram ?? account.link_instagram,
            link_tiktok: updateData.link_tiktok !== undefined ? updateData.link_tiktok : (accountData as any).link_tiktok ?? account.link_tiktok,
            link_youtube: updateData.link_youtube !== undefined ? updateData.link_youtube : (accountData as any).link_youtube ?? account.link_youtube,
            primary_social_link: account.primary_social_link,
            avatar_url: account.avatar_url,
            background_url: account.background_url,
            plan: account.plan,
        };

        return NextResponse.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            account: responseAccount,
        });
    } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

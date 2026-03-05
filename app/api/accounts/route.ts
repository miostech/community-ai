import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import { getTotalFollowers } from '@/lib/social-stats';
import mongoose from 'mongoose';
import Account from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOUNDING_START = new Date('2026-02-23T00:00:00.000Z');
const FOUNDING_END = new Date('2026-03-09T00:00:00.000Z');

async function checkFoundingMember(email: string): Promise<boolean> {
    if (!email?.trim()) return false;
    const normalizedEmail = email.toLowerCase().trim();

    const paidInPeriod = await AccountPayment.findOne({
        email: normalizedEmail,
        order_status: 'paid',
        kiwify_created_at: { $gte: FOUNDING_START, $lt: FOUNDING_END },
    }).lean();
    if (!paidInPeriod) return false;

    const hasRefund = await AccountPayment.findOne({
        email: normalizedEmail,
        order_status: { $in: ['refunded', 'chargeback'] },
    }).lean();
    if (hasRefund) return false;

    const hasCancelled = await AccountPayment.findOne({
        email: normalizedEmail,
        'subscription.status': { $in: ['cancelled', 'cancelado', 'canceled'] },
    }).lean();
    if (hasCancelled) return false;

    return true;
}

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
                returnDocument: 'after',
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

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        // Use native MongoDB driver to avoid any Mongoose schema cache issues
        const account = await Account.collection.findOne({ auth_user_id: authUserId }) as Record<string, any> | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const email = account.email || session.user.email;
        const emailNorm = email?.toLowerCase().trim();
        const lastPayment = await AccountPayment.findOne({
            email: emailNorm,
            webhook_event_type: {
                $in: ['order_approved', 'paid', 'subscription_renewed', 'subscription_canceled'],
            },
        }).sort({ createdAt: -1 }).lean();

        const firstPaidPayment = await AccountPayment.findOne({
            email: emailNorm,
            order_status: 'paid',
        }).sort({ createdAt: 1 }).lean();
        const firstPaidRaw = firstPaidPayment as any;
        const firstPaidAt = firstPaidRaw
            ? (firstPaidRaw.subscription?.start_date
                ? new Date(firstPaidRaw.subscription.start_date).toISOString()
                : firstPaidRaw.createdAt
                    ? new Date(firstPaidRaw.createdAt).toISOString()
                    : null)
            : null;

        let subscriptionStatus: 'active' | 'expired' | 'inactive' = 'inactive';
        let subscriptionExpiresAt: Date | null = null;

        if (lastPayment) {
            const payment = lastPayment as any;
            if (payment.order_status === 'refunded') {
                subscriptionStatus = 'inactive';
                subscriptionExpiresAt = null;
            } else if (payment.subscription?.next_payment) {
                subscriptionExpiresAt = new Date(payment.subscription.next_payment);
                subscriptionStatus = subscriptionExpiresAt > new Date() ? 'active' : 'expired';
            } else if (
                payment.order_status === 'paid' &&
                ['order_approved', 'paid'].includes(payment.webhook_event_type)
            ) {
                subscriptionStatus = 'active';
                subscriptionExpiresAt = null;
            }
        }

        const payment = lastPayment as any;

        const isFoundingMember = await checkFoundingMember(email);
        if ((account.is_founding_member ?? false) !== isFoundingMember) {
            Account.collection.updateOne(
                { _id: account._id },
                { $set: { is_founding_member: isFoundingMember } }
            ).catch(() => {});
        }

        return NextResponse.json({
            success: true,
            account: {
                id: account._id?.toString?.() ?? String(account._id),
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
                used_instagram_avatar: account.used_instagram_avatar === true,
                instagram_avatar_used_at: account.instagram_avatar_used_at
                    ? new Date(account.instagram_avatar_used_at).toISOString()
                    : null,
                background_url: account.background_url,
                plan: account.plan,
                code_invite: account.code_invite,
                role: account.role || 'user',
                is_founding_member: isFoundingMember,
                request_cancel_at: account.request_cancel_at
                    ? new Date(account.request_cancel_at).toISOString()
                    : null,
                geo_country: account.geo_country ?? null,
                geo_region: account.geo_region ?? null,
                geo_city: account.geo_city ?? null,
                geo_lat: account.geo_lat ?? null,
                geo_lon: account.geo_lon ?? null,
                geo_updated_at: account.geo_updated_at
                    ? new Date(account.geo_updated_at).toISOString()
                    : null,
                birth_date: account.birth_date
                    ? new Date(account.birth_date).toISOString()
                    : null,
                gender: account.gender ?? null,
                category: account.category ?? null,
                niches: account.niches ?? [],
                address_country: account.address_country ?? null,
                address_state: account.address_state ?? null,
                address_city: account.address_city ?? null,
                interest_product_campaigns: account.interest_product_campaigns ?? false,
                address_zip: account.address_zip ?? null,
                address_street: account.address_street ?? null,
                address_number: account.address_number ?? null,
                address_complement: account.address_complement ?? null,
                address_neighborhood: account.address_neighborhood ?? null,
                link_media_kit: account.link_media_kit ?? null,
                portfolio_videos: account.portfolio_videos ?? [],
                payment_pix_key: account.payment_pix_key ?? null,
                payment_revolut_account: account.payment_revolut_account ?? null,
                followers_at_signup: account.followers_at_signup ?? null,
            },
            subscription: {
                status: subscriptionStatus,
                expires_at: subscriptionExpiresAt,
                order_status: payment?.order_status ?? null,
                subscription_status: payment?.subscription?.status ?? null,
                product_name: payment?.product_name || null,
                last_payment_at: payment?.createdAt || null,
                payment_method: payment?.payment_method || null,
                plan_frequency: payment?.subscription?.plan_frequency || null,
                first_paid_at: firstPaidAt,
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

        const allowedFields = [
            'first_name', 'last_name', 'email', 'phone', 'phone_country_code',
            'link_instagram', 'link_tiktok', 'link_youtube', 'primary_social_link',
            'avatar_url', 'background_url', 'birth_date', 'gender', 'category',
            'niches', 'address_country', 'address_state', 'address_city',
            'interest_product_campaigns', 'address_zip', 'address_street', 'address_number', 'address_complement', 'address_neighborhood',
            'link_media_kit', 'portfolio_videos',
            'payment_pix_key', 'payment_revolut_account',
        ];

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

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        // Use native MongoDB driver directly to avoid any Mongoose schema/cache issues
        const col = Account.collection;
        const acc = await col.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: updateData },
            { returnDocument: 'after' }
        ) as Record<string, any> | null;

        if (!acc) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Registrar seguidores no "cadastro" (primeira vez que temos redes)
        const hasLinks = !!(acc.link_instagram?.trim() || acc.link_tiktok?.trim() || acc.link_youtube?.trim());
        if (hasLinks && (acc.followers_at_signup === undefined || acc.followers_at_signup === null)) {
            try {
                const total = await getTotalFollowers({
                    instagram: acc.link_instagram,
                    tiktok: acc.link_tiktok,
                    youtube: acc.link_youtube,
                });
                await col.updateOne({ _id: acc._id }, { $set: { followers_at_signup: total } });
            } catch (e) {
                console.error('Erro ao registrar followers_at_signup:', e);
            }
        }

        const responseAccount = {
            id: acc._id?.toString?.() ?? String(acc._id),
            first_name: acc.first_name,
            last_name: acc.last_name,
            email: acc.email,
            phone: acc.phone,
            phone_country_code: acc.phone_country_code,
            link_instagram: acc.link_instagram ?? null,
            link_tiktok: acc.link_tiktok ?? null,
            link_youtube: acc.link_youtube ?? null,
            primary_social_link: acc.primary_social_link ?? null,
            avatar_url: acc.avatar_url ?? null,
            background_url: acc.background_url ?? null,
            plan: acc.plan,
            birth_date: acc.birth_date ? new Date(acc.birth_date).toISOString() : null,
            gender: acc.gender ?? null,
            category: acc.category ?? null,
            niches: acc.niches ?? [],
            address_country: acc.address_country ?? null,
            address_state: acc.address_state ?? null,
            address_city: acc.address_city ?? null,
            interest_product_campaigns: acc.interest_product_campaigns ?? false,
            address_zip: acc.address_zip ?? null,
            address_street: acc.address_street ?? null,
            address_number: acc.address_number ?? null,
            address_complement: acc.address_complement ?? null,
            address_neighborhood: acc.address_neighborhood ?? null,
            link_media_kit: acc.link_media_kit ?? null,
            portfolio_videos: acc.portfolio_videos ?? [],
            payment_pix_key: acc.payment_pix_key ?? null,
            payment_revolut_account: acc.payment_revolut_account ?? null,
            followers_at_signup: acc.followers_at_signup ?? null,
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

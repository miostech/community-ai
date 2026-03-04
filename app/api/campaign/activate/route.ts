import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRIAL_DAYS = 10;
const CAMPAIGN_COOKIE = 'dome_campaign';
const CAMPAIGN_PRODUCT_NAME = 'Dome - Campanha 10 dias grátis';

export async function GET(request: NextRequest) {
    const baseUrl = request.nextUrl.origin;

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.redirect(new URL('/campanha', baseUrl));
        }

        const campaignCookie = request.cookies.get(CAMPAIGN_COOKIE)?.value;

        if (!campaignCookie) {
            return NextResponse.redirect(new URL('/dashboard/comunidade', baseUrl));
        }

        await connectMongo();

        const authUserId =
            (session.user as Record<string, unknown>).auth_user_id as string | undefined ||
            session.user.id;

        const account = await Account.findOne({ auth_user_id: authUserId });

        if (!account) {
            return NextResponse.redirect(new URL('/campanha', baseUrl));
        }

        const email = account.email || (session.user.email ?? '');

        const existingCampaignPayment = await AccountPayment.findOne({
            email: email.toLowerCase().trim(),
            product_name: CAMPAIGN_PRODUCT_NAME,
        });

        if (existingCampaignPayment) {
            const response = NextResponse.redirect(new URL('/dashboard/comunidade', baseUrl));
            response.cookies.set(CAMPAIGN_COOKIE, '', { path: '/', maxAge: 0 });
            return response;
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        const orderId = `campaign-10days-${randomUUID()}`;

        await AccountPayment.create({
            account_id: account._id,
            email: email.toLowerCase().trim(),
            order_id: orderId,
            order_ref: orderId,
            order_status: 'paid',
            webhook_event_type: 'order_approved',
            product_type: 'membership',
            payment_method: 'pix',
            installments: 1,
            sale_type: 'producer',
            product_id: 'campaign-10days-free',
            product_name: CAMPAIGN_PRODUCT_NAME,
            customer: {
                full_name: `${account.first_name} ${account.last_name}`.trim(),
                first_name: account.first_name,
                email: email.toLowerCase().trim(),
            },
            subscription: {
                id: `campaign-sub-${randomUUID()}`,
                status: 'active',
                start_date: now,
                next_payment: expiresAt,
                plan_name: 'Campanha 10 dias grátis',
                plan_frequency: 'once',
            },
            commissions: {
                charge_amount: 0,
                product_base_price: 0,
                currency: 'BRL',
                kiwify_fee: 0,
                settlement_amount: 0,
                my_commission: 0,
            },
            kiwify_created_at: now,
            approved_date: now,
            store_id: 'dome-campaign',
        });

        await Account.updateOne(
            { _id: account._id },
            {
                $set: {
                    plan: 'pro',
                    plan_expire_at: expiresAt,
                },
            }
        );

        const response = NextResponse.redirect(new URL('/dashboard/comunidade', baseUrl));
        response.cookies.set(CAMPAIGN_COOKIE, '', { path: '/', maxAge: 0 });

        return response;
    } catch (error) {
        console.error('Erro ao ativar campanha:', error);
        return NextResponse.redirect(new URL('/dashboard/comunidade', baseUrl));
    }
}

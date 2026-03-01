import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOUNDING_START = new Date('2026-02-23T00:00:00.000Z');
const FOUNDING_END = new Date('2026-03-09T00:00:00.000Z');

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    await connectMongo();

    const normalizedEmail = email.toLowerCase().trim();

    const allPayments = await AccountPayment.find({ email: normalizedEmail })
        .select('email order_status kiwify_created_at subscription webhook_event_type product_name')
        .sort({ createdAt: -1 })
        .lean();

    const paidInPeriod = allPayments.filter(
        (p: any) =>
            p.order_status === 'paid' &&
            p.kiwify_created_at &&
            new Date(p.kiwify_created_at) >= FOUNDING_START &&
            new Date(p.kiwify_created_at) < FOUNDING_END
    );

    const account = await Account.findOne({ email: normalizedEmail })
        .select('email is_founding_member role first_name last_name')
        .lean();

    return NextResponse.json({
        email: normalizedEmail,
        account: account ? {
            name: `${(account as any).first_name} ${(account as any).last_name}`.trim(),
            is_founding_member: (account as any).is_founding_member,
            role: (account as any).role,
        } : null,
        totalPayments: allPayments.length,
        paymentsInFoundingPeriod: paidInPeriod.length,
        payments: allPayments.map((p: any) => ({
            order_status: p.order_status,
            kiwify_created_at: p.kiwify_created_at,
            webhook_event_type: p.webhook_event_type,
            product_name: p.product_name,
            subscription_status: p.subscription?.status,
        })),
    });
}

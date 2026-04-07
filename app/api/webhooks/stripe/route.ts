import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import mongoose from 'mongoose';
import { connectMongo } from '@/lib/mongoose';
import { getStripe } from '@/lib/stripe';
import BusinessAccount from '@/models/BusinessAccount';
import WalletStripeTopUp from '@/models/WalletStripeTopUp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function shouldCreditWallet(session: Stripe.Checkout.Session, eventType: string): boolean {
    if (session.mode !== 'payment') {
        return false;
    }
    if (eventType === 'checkout.session.async_payment_succeeded') {
        return true;
    }
    if (eventType === 'checkout.session.completed' && session.payment_status === 'paid') {
        return true;
    }
    return false;
}

async function processCheckoutSession(session: Stripe.Checkout.Session, eventType: string) {
    if (!shouldCreditWallet(session, eventType)) {
        return;
    }

    const accountId = session.metadata?.account_id;
    const creditedCents = parseInt(session.metadata?.credited_cents ?? '', 10);
    const metaPaid = parseInt(session.metadata?.amount_paid_cents ?? '', 10);
    const amountTotal =
        typeof session.amount_total === 'number' && session.amount_total > 0
            ? session.amount_total
            : metaPaid;

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
        console.error('Stripe webhook: account_id inválido', session.id);
        return;
    }
    if (!Number.isFinite(creditedCents) || creditedCents <= 0) {
        console.error('Stripe webhook: credited_cents inválido', session.id);
        return;
    }
    if (!Number.isFinite(amountTotal) || amountTotal <= 0) {
        console.error('Stripe webhook: valor pago inválido', session.id);
        return;
    }

    await connectMongo();

    const txn = await mongoose.startSession();
    txn.startTransaction();
    try {
        await WalletStripeTopUp.create(
            [
                {
                    stripe_session_id: session.id,
                    account_id: new mongoose.Types.ObjectId(accountId),
                    credited_cents: creditedCents,
                    amount_paid_cents: amountTotal,
                },
            ],
            { session: txn }
        );

        await BusinessAccount.updateOne(
            { account_id: accountId },
            { $inc: { wallet_balance_cents: creditedCents } },
            { upsert: true, runValidators: true, setDefaultsOnInsert: true, session: txn }
        );

        await txn.commitTransaction();
    } catch (e: unknown) {
        await txn.abortTransaction();
        const code = (e as { code?: number }).code;
        if (code === 11000) {
            return;
        }
        throw e;
    } finally {
        txn.endSession();
    }
}

export async function POST(req: NextRequest) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers.get('stripe-signature');
    if (!secret || !sig) {
        return NextResponse.json({ error: 'Webhook não configurado' }, { status: 400 });
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err) {
        console.error('Stripe webhook assinatura:', err);
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
    }

    try {
        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            const session = event.data.object as Stripe.Checkout.Session;
            await processCheckoutSession(session, event.type);
        }
    } catch (e) {
        console.error('Stripe webhook processamento:', e);
        return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

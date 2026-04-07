import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import { getStripe } from '@/lib/stripe';
import Account from '@/models/Account';
import { getWalletTopUpCouponById, MIN_WALLET_RECHARGE_CENTS } from '@/lib/wallet-coupons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MARCA_ROLES = new Set(['marca', 'moderator', 'admin']);
const PLATFORM_FEE = 0.15;

function paymentMethodTypes(method: string): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
    switch (method) {
        case 'card':
            return ['card'];
        case 'boleto':
            return ['boleto'];
        case 'pix':
            return ['pix'];
        default:
            return ['card'];
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const authUserId =
            (session?.user as { auth_user_id?: string } | undefined)?.auth_user_id || session?.user?.id;
        if (!authUserId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: 'Pagamentos não configurados no servidor.' }, { status: 503 });
        }

        await connectMongo();
        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id role').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }
        if (!MARCA_ROLES.has(account.role || 'user')) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await req.json();
        const amountCents = typeof body.amountCents === 'number' ? Math.round(body.amountCents) : NaN;
        const paymentMethod = String(body.paymentMethod || 'card');
        const couponId = typeof body.couponId === 'string' ? body.couponId.trim() : '';
        const coupon = couponId ? getWalletTopUpCouponById(couponId) : undefined;

        if (!Number.isFinite(amountCents) || amountCents < MIN_WALLET_RECHARGE_CENTS || amountCents > 999_999_999) {
            return NextResponse.json({ error: 'Valor inválido (mín. R$ 500,00 por recarga).' }, { status: 400 });
        }

        if (couponId && !coupon) {
            return NextResponse.json({ error: 'Cupom inválido.' }, { status: 400 });
        }
        if (coupon && amountCents < coupon.minDepositCents) {
            const minLabel = (coupon.minDepositCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            });
            return NextResponse.json(
                { error: `Valor mínimo da recarga para este cupom: ${minLabel}.` },
                { status: 400 }
            );
        }

        const bonusCents = coupon?.bonusCents ?? 0;
        const fee = Math.round(amountCents * PLATFORM_FEE);
        const credited = amountCents - fee + bonusCents;
        if (credited <= 0) {
            return NextResponse.json({ error: 'Valor após taxa inválido.' }, { status: 400 });
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const stripe = getStripe();

        const creditedLabel = (credited / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
        const bonusLabel =
            bonusCents > 0
                ? ` Inclui bônus de cupom: ${(bonusCents / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                  })}.`
                : '';

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'payment',
            currency: 'brl',
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        unit_amount: amountCents,
                        product_data: {
                            name: 'Recarga de saldo — Dome (marca)',
                            description: `Crédito total na carteira após taxa${bonusCents > 0 ? ' e bônus' : ''}: ${creditedLabel}.${bonusLabel}`,
                        },
                    },
                    quantity: 1,
                },
            ],
            payment_method_types: paymentMethodTypes(paymentMethod),
            metadata: {
                account_id: account._id.toString(),
                credited_cents: String(credited),
                fee_cents: String(fee),
                amount_paid_cents: String(amountCents),
                ...(coupon ? { wallet_coupon_id: coupon.id, bonus_cents: String(bonusCents) } : {}),
            },
            success_url: `${baseUrl}/marca/inicio?wallet=success`,
            cancel_url: `${baseUrl}/marca/inicio?wallet=cancel`,
        });

        if (!checkoutSession.url) {
            return NextResponse.json({ error: 'Sessão de pagamento sem URL.' }, { status: 500 });
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (e: unknown) {
        const err = e as { type?: string; message?: string; raw?: { message?: string } };
        console.error('checkout-session:', e);
        if (err.type === 'StripeInvalidRequestError' || err.message?.includes('payment_method_types')) {
            return NextResponse.json(
                {
                    error:
                        err.message ||
                        'Método de pagamento indisponível. Ative cartão, boleto e/ou PIX no Stripe ou tente outro método.',
                },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Erro ao criar sessão de pagamento.' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import { getSubscriptionsByEmail } from '@/lib/kiwify';
import Account from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';
import {
  getPlanSlugFromProductIds,
  getPlanSlugFromProductId,
  getPlanSlugFromProductName,
  type DomePlanSlug,
} from '@/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório', ok: false }, { status: 400 });
    }

    await connectMongo();

    let planSlug: DomePlanSlug | null = null;
    let customerName: string | undefined;
    let courseIds: string[] = [];
    let subscriptionExpiresAt: string | null = null;

    // 1) Tentar AccountPayment (webhook já registrou pagamento para este email)
    const lastPaid = await AccountPayment.findOne({
      email,
      order_status: 'paid',
    })
      .sort({ createdAt: -1 })
      .lean();

    if (lastPaid) {
      const payment = lastPaid as { product_id?: string; product_name?: string; customer?: { full_name?: string }; subscription?: { next_payment?: Date } };
      planSlug =
        getPlanSlugFromProductId(payment.product_id ?? '') ??
        getPlanSlugFromProductName(payment.product_name ?? '');
      if (payment.customer?.full_name) customerName = payment.customer.full_name;
      if (payment.subscription?.next_payment) {
        subscriptionExpiresAt = new Date(payment.subscription.next_payment).toISOString();
      }
      if (payment.product_id) courseIds = [payment.product_id];
    }

    // 2) Se não achou plano Dome em AccountPayment, validar pela API Kiwify
    if (!planSlug || courseIds.length === 0) {
      const result = await getSubscriptionsByEmail(email);
      courseIds = result.courseIds ?? [];
      if (result.customerName) customerName = result.customerName;
      planSlug = planSlug ?? getPlanSlugFromProductIds(courseIds);
    }

    // Esta página só vale para compra do plano Dome (não cursos como MIM, Roteiro Viral, HPA)
    const hasDomePurchase = planSlug != null;
    if (!hasDomePurchase) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Nenhuma compra encontrada para este email. Use o mesmo email da sua compra da DOME na Kiwify.',
        },
        { status: 200 }
      );
    }

    // Email de compra já vinculado a alguma conta? (email ou kiwify_purchase_email)
    const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const existingAccount = await Account.findOne({
      $or: [{ email: emailRegex }, { kiwify_purchase_email: email }],
    }).lean();

    if (existingAccount) {
      return NextResponse.json({
        ok: true,
        alreadyLinked: true,
        planSlug: planSlug ?? undefined,
        customerName: customerName ?? undefined,
      });
    }

    return NextResponse.json({
      ok: true,
      planSlug: planSlug ?? undefined,
      customerName: customerName ?? undefined,
      courseIds,
      subscriptionExpiresAt: subscriptionExpiresAt ?? undefined,
    });
  } catch (error) {
    console.error('[validate-purchase]', error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao validar compra. Tente novamente.' },
      { status: 500 }
    );
  }
}

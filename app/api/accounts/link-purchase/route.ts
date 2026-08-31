import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';
import { getPlanSlugFromProductId, getPlanSlugFromProductName } from '@/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
        }

        const authUserId = (session.user as Record<string, unknown>).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id email kiwify_purchase_email')
            .lean() as { _id: unknown; email?: string; kiwify_purchase_email?: string } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        if (account.kiwify_purchase_email === email) {
            return NextResponse.json({ error: 'Este email já está vinculado à sua conta.' }, { status: 400 });
        }

        const otherAccount = await Account.findOne({
            kiwify_purchase_email: email,
            auth_user_id: { $ne: authUserId },
        } as any).lean();

        if (otherAccount) {
            return NextResponse.json(
                { error: 'Este email de compra já está vinculado a outra conta. Entre em contato com o suporte.' },
                { status: 409 }
            );
        }

        const payments = await AccountPayment.find({
            email,
            order_status: 'paid',
        })
            .sort({ createdAt: -1 })
            .lean() as { order_id?: string; product_id?: string; product_name?: string; customer?: { full_name?: string } }[];

        const domePayment = payments.find((p) => {
            const byId = getPlanSlugFromProductId(p.product_id || '');
            const byName = getPlanSlugFromProductName(p.product_name || '');
            return byId || byName;
        });

        if (!domePayment) {
            if (payments.length > 0) {
                return NextResponse.json(
                    { error: 'Encontramos compras com esse email, mas nenhuma é do plano Dome. Use o email da compra do plano Dome.' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: 'Nenhuma compra da Dome encontrada com esse email. Verifique se digitou o email correto.' },
                { status: 404 }
            );
        }

        await Account.updateOne(
            { auth_user_id: authUserId },
            {
                $set: {
                    kiwify_purchase_email: email,
                    cached_course_ids: [],
                    cached_course_ids_at: null,
                },
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Compra vinculada com sucesso!',
            product_name: domePayment.product_name,
            customer_name: domePayment.customer?.full_name,
        });
    } catch (error) {
        console.error('[link-purchase]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

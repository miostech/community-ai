import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import { getStripe } from '@/lib/stripe';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CREDIT_PACKAGES = [
    { id: 'credits-10', messages: 10, priceCents: 990, label: '10 mensagens' },
    { id: 'credits-25', messages: 25, priceCents: 1990, label: '25 mensagens' },
    { id: 'credits-50', messages: 50, priceCents: 3490, label: '50 mensagens' },
] as const;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: 'Pagamentos não configurados.' }, { status: 503 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const body = await req.json();
        const packageId = String(body.packageId || '');
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);

        if (!pkg) {
            return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 });
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const stripe = getStripe();

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'payment',
            currency: 'brl',
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        unit_amount: pkg.priceCents,
                        product_data: {
                            name: `Créditos de IA — ${pkg.label}`,
                            description: `${pkg.messages} mensagens extras para o Chat com IA da Dome`,
                        },
                    },
                    quantity: 1,
                },
            ],
            payment_method_types: ['card', 'pix'],
            metadata: {
                type: 'chat_credits',
                account_id: account._id.toString(),
                credits: String(pkg.messages),
                package_id: pkg.id,
            },
            success_url: `${baseUrl}/dashboard/chat?credits=success`,
            cancel_url: `${baseUrl}/dashboard/chat?credits=cancel`,
        });

        if (!checkoutSession.url) {
            return NextResponse.json({ error: 'Erro ao criar sessão de pagamento.' }, { status: 500 });
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('buy-credits:', error);
        return NextResponse.json({ error: 'Erro ao criar sessão de pagamento.' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        packages: CREDIT_PACKAGES.map(p => ({
            id: p.id,
            messages: p.messages,
            price: (p.priceCents / 100).toFixed(2).replace('.', ','),
            priceCents: p.priceCents,
        })),
    });
}

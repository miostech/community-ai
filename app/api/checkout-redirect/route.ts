import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// URLs de checkout da Kiwify para cada plano
const PLAN_URLS: Record<string, string> = {
    'dome-mensal': 'https://pay.kiwify.com.br/KV5Y885',
    'dome-semestral': 'https://pay.kiwify.com.br/fd3eJFq',
    'dome-anual': 'https://pay.kiwify.com.br/iLSMfoH',
};

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const planId = searchParams.get('plan');

        console.log('🛒 Checkout redirect:', { planId, email: session?.user?.email });

        if (!planId) {
            return NextResponse.redirect(new URL('/precos', request.url));
        }

        const baseUrl = PLAN_URLS[planId];
        if (!baseUrl) {
            return NextResponse.redirect(new URL('/precos', request.url));
        }

        // Monta a URL de checkout com o email do usuário (se logado)
        const checkoutUrl = new URL(baseUrl);
        if (session?.user?.email) {
            checkoutUrl.searchParams.set('email', session.user.email);
        }

        console.log('🛒 Redirecting to:', checkoutUrl.toString());

        return NextResponse.redirect(checkoutUrl.toString());
    } catch (error) {
        console.error('Erro no redirect de checkout:', error);
        return NextResponse.redirect(new URL('/precos', request.url));
    }
}

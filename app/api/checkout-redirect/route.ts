import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// URLs de checkout da Kiwify para cada plano
const PLAN_URLS: Record<string, string> = {
    'conteudo-ia': 'https://pay.kiwify.com.br/1k68u0Y',
    'combo-viral': 'https://pay.kiwify.com.br/1k68u0Y', // TODO: Atualizar com URL correta do combo
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

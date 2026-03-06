import { NextRequest, NextResponse } from 'next/server';

/**
 * Esta rota é chamada após login OAuth quando o redirectTo original é perdido.
 * Ela verifica se há um cookie `post_login_redirect` e redireciona para essa URL.
 * Isso é especialmente útil para Apple OAuth que às vezes perde o state.
 */
export async function GET(request: NextRequest) {
    const redirectCookie = request.cookies.get('post_login_redirect')?.value;

    console.log('🔄 Post-login redirect check:', {
        hasRedirectCookie: !!redirectCookie,
        cookieValue: redirectCookie
    });

    // Limpa o cookie de redirect (definindo expiração no passado)
    const response = NextResponse.redirect(
        redirectCookie
            ? new URL(decodeURIComponent(redirectCookie), request.url)
            : new URL('/dashboard', request.url)
    );

    // Remove o cookie após usar
    response.cookies.set('post_login_redirect', '', {
        path: '/',
        maxAge: 0,
        httpOnly: false,
    });

    if (redirectCookie) {
        console.log('✅ Redirecionando para:', decodeURIComponent(redirectCookie));
    } else {
        console.log('📍 Sem cookie de redirect, indo para /dashboard');
    }

    return response;
}

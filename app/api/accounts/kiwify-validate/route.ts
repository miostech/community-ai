import { NextRequest, NextResponse } from 'next/server';
import { validateKiwifyCredentials } from '@/lib/kiwify-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Valida email + senha Kiwify e cria/atualiza a conta se necessário.
 * Retorna a mensagem de erro real para exibir na tela (em vez de depender do NextAuth).
 * POST /api/accounts/kiwify-validate { email, password }
 */
export async function POST(request: NextRequest) {
  try {
    let body: { email?: unknown; password?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Requisição inválida. Envie email e senha.' },
        { status: 400 }
      );
    }
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    const result = await validateKiwifyCredentials(email, password);

    if (result.ok) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  } catch (err) {
    console.error('[api/accounts/kiwify-validate]', err);
    return NextResponse.json(
      { ok: false, error: 'Erro ao validar. Tente novamente.' },
      { status: 500 }
    );
  }
}

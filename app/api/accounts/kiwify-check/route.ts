import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import { hasKiwifyPurchase } from '@/lib/kiwify';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Verifica se o email (Kiwify) já tem senha cadastrada.
 * Só retorna hasPassword se o email tiver compra na Kiwify (evita vazar se o email tem conta).
 * GET /api/accounts/kiwify-check?email=xxx
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim()?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    const { hasAccess } = await hasKiwifyPurchase(email);
    if (!hasAccess) {
      return NextResponse.json({ hasPassword: false });
    }

    await connectMongo();
    const authUserId = `kiwify:${email}`;
    const account = await Account.findOne({ auth_user_id: authUserId })
      .select('+password_hash')
      .lean();

    const hasPassword = !!(account as { password_hash?: string } | null)?.password_hash;
    return NextResponse.json({ hasPassword });
  } catch (err) {
    console.error('[api/accounts/kiwify-check]', err);
    return NextResponse.json({ hasPassword: false });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

const COOKIE_NAME = 'dome_kiwify_purchase';
const COOKIE_MAX_AGE = 600; // 10 min

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const dashboardUrl = new URL('/dashboard/comunidade', baseUrl);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', baseUrl));
    }

    const authUserId =
      (session.user as Record<string, unknown>).auth_user_id as string | undefined ||
      session.user.id;
    if (!authUserId) {
      return NextResponse.redirect(dashboardUrl);
    }

    const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookieValue) {
      return NextResponse.redirect(dashboardUrl);
    }

    let payload: { email?: string; planSlug?: string };
    try {
      payload = JSON.parse(
        cookieValue.startsWith('%') ? decodeURIComponent(cookieValue) : cookieValue
      );
    } catch {
      const response = NextResponse.redirect(dashboardUrl);
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
      return response;
    }

    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    if (!email) {
      const response = NextResponse.redirect(dashboardUrl);
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
      return response;
    }

    await connectMongo();

    // Um mesmo email de compra não pode estar vinculado a outra conta
    const otherWithSamePurchaseEmail = await Account.findOne({
      kiwify_purchase_email: email,
      auth_user_id: { $ne: authUserId },
    }).lean();

    if (otherWithSamePurchaseEmail) {
      const response = NextResponse.redirect(new URL('/login?message=email_ja_vinculado', baseUrl));
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
      return response;
    }

    await Account.updateOne(
      { auth_user_id: authUserId },
      { $set: { kiwify_purchase_email: email } }
    );

    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
    return response;
  } catch (err) {
    console.error('[link-kiwify-purchase]', err);
    return NextResponse.redirect(dashboardUrl);
  }
}

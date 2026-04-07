import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const COOKIE = 'marca_signup_intent';

export async function POST() {
    const store = await cookies();
    store.set(COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 30,
        secure: process.env.NODE_ENV === 'production',
    });
    return NextResponse.json({ ok: true });
}

export async function DELETE() {
    const store = await cookies();
    store.delete(COOKIE);
    return NextResponse.json({ ok: true });
}

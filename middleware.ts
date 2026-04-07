import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (pathname === '/dashboard/marca' || pathname.startsWith('/dashboard/marca/')) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.replace(/^\/dashboard\/marca/, '/marca');
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/marca', '/dashboard/marca/:path*'],
};

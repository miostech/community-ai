import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string | null {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return null;
}

/** POST: registra aceite dos termos do portfólio (LGPD). Data/hora e localização são gravados no servidor. */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

        await connectMongo();

        const account = await Account.findOne(
            { auth_user_id: authUserId },
            { geo_country: 1, geo_region: 1, geo_city: 1 }
        ).lean();

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const acc = account as { geo_country?: string; geo_region?: string; geo_city?: string };
        const now = new Date();
        const ip = getClientIp(request);

        await Account.updateOne(
            { auth_user_id: authUserId },
            {
                $set: {
                    portfolio_terms_accepted_at: now,
                    portfolio_terms_accepted_ip: ip ?? null,
                    portfolio_terms_accepted_country: acc.geo_country ?? null,
                    portfolio_terms_accepted_region: acc.geo_region ?? null,
                    portfolio_terms_accepted_city: acc.geo_city ?? null,
                },
            }
        );

        return NextResponse.json({
            success: true,
            accepted_at: now.toISOString(),
        });
    } catch (error) {
        console.error('Erro ao registrar aceite dos termos do portfólio:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

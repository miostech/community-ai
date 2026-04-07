import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import { getDomeCreatorsPortfolio } from '@/lib/dome-creators-portfolio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MARCA_ROLES = new Set(['marca', 'moderator', 'admin']);

// GET — mesmo portfólio “Dome Creators” para marcas no portal
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const authUserId =
            (session?.user as { auth_user_id?: string } | undefined)?.auth_user_id || session?.user?.id;
        if (!authUserId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();
        const account = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }
        if (!MARCA_ROLES.has(account.role || 'user')) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const sortByParam = request.nextUrl.searchParams.get('sortBy');
        const sortBy: 'engagement' | 'followers' =
            sortByParam === 'followers' ? 'followers' : 'engagement';

        const { creators, stats, sortBy: resolved } = await getDomeCreatorsPortfolio(sortBy);

        return NextResponse.json({
            creators,
            stats,
            sortBy: resolved,
        });
    } catch (error) {
        console.error('GET /api/marca/criadores:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

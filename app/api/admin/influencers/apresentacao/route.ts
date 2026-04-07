import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import { getDomeCreatorsPortfolio } from '@/lib/dome-creators-portfolio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Top creators para portfólio marcas + métricas agregadas
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const adminAccount = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        const role = (adminAccount as { role?: string } | null)?.role;

        if (!adminAccount || role !== 'moderator') {
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
        console.error('Erro ao buscar apresentação:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

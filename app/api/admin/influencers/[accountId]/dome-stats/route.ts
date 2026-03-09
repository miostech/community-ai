import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import WeeklyRankingModel from '@/models/WeeklyRanking';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - ranking_position (semana atual), ranking_week, ranking_wins para um influenciador
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accountId: string }> }
) {
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

        const { accountId } = await params;
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const wins = await WeeklyRankingModel.countDocuments({
            account_id: new mongoose.Types.ObjectId(accountId),
            position: 1,
        });

        const url = request.nextUrl ? new URL('/api/accounts/stories', request.nextUrl.origin).toString() : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/accounts/stories`;
        const storiesRes = await fetch(url, {
            headers: { cookie: request.headers.get('cookie') || '' },
        });
        let ranking_position: number | null = null;
        let ranking_week: string | null = null;

        if (storiesRes.ok) {
            const data = await storiesRes.json();
            const users = data.users || [];
            const idx = users.findIndex((u: { id: string }) => u.id === accountId);
            if (idx >= 0) ranking_position = idx + 1;
            if (data.week?.label) ranking_week = data.week.label;
        }

        return NextResponse.json({
            ranking_position,
            ranking_week,
            ranking_wins: wins,
        });
    } catch (error) {
        console.error('Erro ao buscar dome-stats:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

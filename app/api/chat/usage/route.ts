import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import ChatMessageModel from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_MESSAGES_TRIAL = 10;
const DAILY_MESSAGES_PAID = 20;

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const isTrialActive = account.campaign_14_days_trial_ends_at
            && new Date(account.campaign_14_days_trial_ends_at) > new Date();
        const isPaid = account.subscription_active;

        if (!isPaid && !isTrialActive) {
            return NextResponse.json({ daily_limit: 0, used_today: 0, remaining: 0, extra_credits: 0 });
        }

        const dailyLimit = isPaid ? DAILY_MESSAGES_PAID : DAILY_MESSAGES_TRIAL;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const usedToday = await ChatMessageModel.countDocuments({
            account_id: account._id,
            role: 'user',
            created_at: { $gte: todayStart },
        });

        return NextResponse.json({
            daily_limit: dailyLimit,
            used_today: usedToday,
            remaining: Math.max(0, dailyLimit - usedToday),
            extra_credits: account.chat_extra_credits || 0,
        });
    } catch (error: any) {
        console.error('Erro ao buscar uso do chat:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

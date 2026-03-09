import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import AccountModel from '@/models/Account';
import { getCombinedEngagementScore } from '@/lib/engagement-score';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOP_N = 3;
const POOL_SIZE = 20;
const BATCH_SIZE = 4;

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const adminAccount = await AccountModel.findOne({ auth_user_id: authUserId }).select('role').lean();
        const role = (adminAccount as { role?: string } | null)?.role;

        if (!adminAccount || role !== 'moderator') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const influencerAccounts = await AccountModel.find({
            $or: [
                { link_instagram: { $exists: true, $ne: '', $regex: /./ } },
                { link_tiktok: { $exists: true, $ne: '', $regex: /./ } },
            ],
        })
            .select('_id first_name last_name avatar_url link_instagram link_tiktok')
            .sort({ followers_at_signup: -1 })
            .limit(POOL_SIZE)
            .lean();

        if (influencerAccounts.length === 0) {
            return NextResponse.json({
                users: [],
                source: 'redes_sociais',
            });
        }

        const origin = request.nextUrl?.origin ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
        const cookie = request.headers.get('cookie') ?? '';

        const withScores: { account: (typeof influencerAccounts)[0]; score: number }[] = [];

        for (let i = 0; i < influencerAccounts.length; i += BATCH_SIZE) {
            const batch = influencerAccounts.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(
                batch.map(async (account) => {
                    const accountId = (account as { _id: { toString: () => string } })._id.toString();
                    try {
                        const res = await fetch(`${origin}/api/admin/creators/${accountId}/social-stats`, {
                            headers: { cookie },
                        });
                        if (!res.ok) return null;
                        const data = await res.json();
                        const score = getCombinedEngagementScore({
                            instagram: data.instagram
                                ? {
                                      followers: data.instagram.followers ?? null,
                                      avg_likes: data.instagram.avg_likes ?? null,
                                      avg_comments: data.instagram.avg_comments ?? null,
                                  }
                                : null,
                            tiktok: data.tiktok
                                ? {
                                      followers: data.tiktok.followers ?? null,
                                      hearts: data.tiktok.hearts ?? null,
                                      posts_count: data.tiktok.posts_count ?? null,
                                  }
                                : null,
                        });
                        return score !== null ? { account, score } : null;
                    } catch {
                        return null;
                    }
                })
            );
            results.forEach((r) => {
                if (r) withScores.push(r);
            });
        }

        withScores.sort((a, b) => b.score - a.score);
        const top = withScores.slice(0, TOP_N);

        const users = top.map(({ account, score }) => {
            const fullName = (account as { last_name?: string; first_name: string }).last_name
                ? `${(account as { first_name: string }).first_name} ${(account as { last_name: string }).last_name}`.trim()
                : (account as { first_name: string }).first_name;
            const nameParts = fullName.split(' ');
            const initials =
                nameParts.length >= 2
                    ? (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
                    : fullName.slice(0, 2).toUpperCase();
            const id = (account as { _id: { toString: () => string } })._id.toString();
            return {
                id,
                name: fullName,
                avatar: (account as { avatar_url?: string }).avatar_url || null,
                initials,
                engagementScore: score,
                instagramProfile: (account as { link_instagram?: string }).link_instagram || undefined,
                tiktokProfile: (account as { link_tiktok?: string }).link_tiktok || undefined,
            };
        });

        return NextResponse.json({
            users,
            source: 'redes_sociais',
        });
    } catch (error) {
        console.error('Erro ao buscar top engagement:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

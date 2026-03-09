import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOP_N = 3;

// Mesma ordenação da apresentação: engajamento (cache) depois seguidores. Top 3 = primeiros 3 do ranking dos Top creators.
export async function GET() {
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

        const filter = {
            $or: [
                { link_instagram: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
                { link_tiktok: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
            ],
        };

        const effectiveFollowersExpr = {
            $ifNull: [
                { $ifNull: ['$cached_followers_total', '$followers_at_signup'] },
                0,
            ],
        };

        const topAccounts = await Account.aggregate([
            { $match: filter },
            { $addFields: { effectiveFollowers: effectiveFollowersExpr } },
            { $sort: { cached_engagement_score: -1, effectiveFollowers: -1 } },
            { $limit: TOP_N },
            {
                $project: {
                    _id: 1,
                    first_name: 1,
                    last_name: 1,
                    avatar_url: 1,
                    link_instagram: 1,
                    link_tiktok: 1,
                    cached_engagement_score: 1,
                },
            },
        ]).exec();

        const users = topAccounts.map((a) => {
            const fullName = (a as { last_name?: string; first_name: string }).last_name
                ? `${(a as { first_name: string }).first_name} ${(a as { last_name: string }).last_name}`.trim()
                : (a as { first_name: string }).first_name;
            const nameParts = fullName.split(' ');
            const initials =
                nameParts.length >= 2
                    ? (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
                    : fullName.slice(0, 2).toUpperCase();
            const id = (a as { _id: mongoose.Types.ObjectId })._id.toString();
            const score = (a as { cached_engagement_score?: number }).cached_engagement_score ?? null;
            return {
                id,
                name: fullName,
                avatar: (a as { avatar_url?: string }).avatar_url || null,
                initials,
                engagementScore: score,
                instagramProfile: (a as { link_instagram?: string }).link_instagram || undefined,
                tiktokProfile: (a as { link_tiktok?: string }).link_tiktok || undefined,
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

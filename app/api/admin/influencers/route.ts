import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET - Lista influenciadores (contas com ig ou tiktok). Query: q (nome ou @), limit.
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

        const { searchParams } = request.nextUrl;
        const q = (searchParams.get('q') || '').trim();
        const limit = Math.min(
            parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
            MAX_LIMIT
        );

        const filter: Record<string, unknown> = {
            $or: [
                { link_instagram: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
                { link_tiktok: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
            ],
        };

        if (q.length > 0) {
            const normalizedQ = q.replace(/^@/, '').trim();
            const regex = new RegExp(escapeRegex(normalizedQ), 'i');
            filter.$and = [
                {
                    $or: [
                        { first_name: regex },
                        { last_name: regex },
                        { link_instagram: regex },
                        { link_tiktok: regex },
                    ],
                },
            ];
        }

        const accounts = await Account.find(filter)
            .select('_id first_name last_name avatar_url link_instagram link_tiktok followers_at_signup cached_followers_total created_at role is_founding_member category')
            .sort({ cached_followers_total: -1, followers_at_signup: -1, created_at: -1 })
            .limit(limit)
            .lean();

        const list = accounts.map((a) => ({
            _id: a._id.toString(),
            first_name: a.first_name,
            last_name: a.last_name,
            avatar_url: a.avatar_url ?? null,
            link_instagram: a.link_instagram ?? null,
            link_tiktok: a.link_tiktok ?? null,
            followers_at_signup: a.followers_at_signup ?? null,
            created_at: a.created_at ? new Date(a.created_at).toISOString() : null,
            role: a.role ?? null,
            is_founding_member: a.is_founding_member ?? false,
            category: a.category ?? null,
        }));

        return NextResponse.json({ influencers: list });
    } catch (error) {
        console.error('Erro ao listar influenciadores:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

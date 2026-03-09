import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import { getSocialStatsForAccount } from '@/lib/fetch-social-stats';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min

const BATCH_SIZE = 4;
const DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Atualiza cached_followers_total e cached_followers_updated_at para influenciadores (1x/dia). */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.SEARCHAPI_API_KEY) {
        return NextResponse.json({ error: 'SEARCHAPI_API_KEY não configurada' }, { status: 503 });
    }

    try {
        await connectMongo();

        const accounts = await Account.find({
            $or: [
                { link_instagram: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
                { link_tiktok: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
            ],
        })
            .select('_id link_instagram link_tiktok')
            .lean();

        const now = new Date();
        let updated = 0;

        for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
            const batch = accounts.slice(i, i + BATCH_SIZE);
            await Promise.all(
                batch.map(async (acc) => {
                    try {
                        const { totalFollowers, engagementScore } = await getSocialStatsForAccount({
                            instagram: (acc as { link_instagram?: string }).link_instagram ?? null,
                            tiktok: (acc as { link_tiktok?: string }).link_tiktok ?? null,
                        });
                        await Account.updateOne(
                            { _id: (acc as { _id: mongoose.Types.ObjectId })._id },
                            {
                                $set: {
                                    cached_followers_total: totalFollowers,
                                    cached_followers_updated_at: now,
                                    cached_engagement_score: engagementScore ?? null,
                                },
                            }
                        );
                        updated++;
                    } catch (e) {
                        console.error('[update-cached-followers]', (acc as { _id: unknown })._id, e);
                    }
                })
            );
            if (i + BATCH_SIZE < accounts.length) {
                await sleep(DELAY_MS);
            }
        }

        return NextResponse.json({
            ok: true,
            total: accounts.length,
            updated,
            at: now.toISOString(),
        });
    } catch (error) {
        console.error('Erro ao atualizar cached followers:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';
import { uploadToYouTube } from '@/lib/youtube-upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(_request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as Record<string, unknown>).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string } | null;

        const staffRoles = ['moderator', 'admin', 'criador'];
        if (!account || !staffRoles.includes(account.role || '')) {
            console.log('[migrate-youtube] Role rejeitada:', account?.role, 'authUserId:', authUserId);
            return NextResponse.json({ error: 'Sem permissão', role: account?.role || 'none' }, { status: 403 });
        }

        if (!process.env.YOUTUBE_REFRESH_TOKEN) {
            return NextResponse.json({ error: 'YouTube não configurado' }, { status: 500 });
        }

        const lives = await LiveEvent.find({
            recording_url: { $exists: true, $ne: null },
            youtube_url: { $exists: false },
            youtube_upload_status: { $nin: ['uploading', 'done'] },
        }).select('_id title recording_url').lean();

        if (lives.length === 0) {
            return NextResponse.json({ message: 'Nenhuma live pendente para migrar', count: 0 });
        }

        const results: { id: string; title: string; status: string; youtube_url?: string }[] = [];

        for (const live of lives) {
            try {
                await LiveEvent.findByIdAndUpdate(live._id, { youtube_upload_status: 'uploading' });

                const youtubeUrl = await uploadToYouTube(
                    live.recording_url!,
                    live.title,
                    `Gravação da live "${live.title}" na comunidade.`
                );

                await LiveEvent.findByIdAndUpdate(live._id, {
                    youtube_url: youtubeUrl,
                    youtube_upload_status: 'done',
                });

                results.push({ id: live._id.toString(), title: live.title, status: 'done', youtube_url: youtubeUrl });
                console.log(`[migrate-youtube] Upload concluído: ${live.title} → ${youtubeUrl}`);
            } catch (err) {
                console.error(`[migrate-youtube] Erro ao migrar ${live.title}:`, err);
                await LiveEvent.findByIdAndUpdate(live._id, { youtube_upload_status: 'failed' });
                results.push({ id: live._id.toString(), title: live.title, status: 'failed' });
            }
        }

        return NextResponse.json({ message: 'Migração concluída', results });
    } catch (error) {
        console.error('[api/lives/migrate-youtube POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

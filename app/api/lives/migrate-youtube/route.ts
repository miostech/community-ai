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

export async function POST(request: NextRequest) {
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
            return NextResponse.json({ error: 'Sem permissão', role: account?.role || 'none' }, { status: 403 });
        }

        if (!process.env.YOUTUBE_REFRESH_TOKEN) {
            return NextResponse.json({ error: 'YouTube não configurado' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const liveId = searchParams.get('id');

        if (liveId) {
            const live = await LiveEvent.findById(liveId);
            if (!live || !live.recording_url) {
                return NextResponse.json({ error: 'Live não encontrada ou sem gravação' }, { status: 404 });
            }
            if (live.youtube_url) {
                return NextResponse.json({ message: 'Já migrada', youtube_url: live.youtube_url });
            }

            live.youtube_upload_status = 'uploading';
            await live.save();

            try {
                const youtubeUrl = await uploadToYouTube(
                    live.recording_url,
                    live.title,
                    `Gravação da live "${live.title}" na comunidade.`
                );
                live.youtube_url = youtubeUrl;
                live.youtube_upload_status = 'done';
                await live.save();
                return NextResponse.json({ status: 'done', title: live.title, youtube_url: youtubeUrl });
            } catch (err) {
                console.error(`[migrate-youtube] Erro:`, err);
                live.youtube_upload_status = 'failed';
                await live.save();
                return NextResponse.json({ error: 'Falha no upload', detail: String(err) }, { status: 500 });
            }
        }

        const lives = await LiveEvent.find({
            recording_url: { $exists: true, $ne: null },
            youtube_url: { $exists: false },
            youtube_upload_status: { $nin: ['uploading', 'done'] },
        }).select('_id title recording_url').lean();

        return NextResponse.json({
            message: `${lives.length} live(s) pendente(s) para migrar`,
            lives: lives.map(l => ({ id: l._id.toString(), title: l.title })),
        });
    } catch (error) {
        console.error('[api/lives/migrate-youtube POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

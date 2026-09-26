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

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ liveId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { liveId } = await params;
        if (!mongoose.Types.ObjectId.isValid(liveId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const authUserId = (session.user as Record<string, unknown>).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const allowedRoles = ['admin', 'moderator', 'criador'];
        if (event.creator_id.toString() !== account._id.toString() && !allowedRoles.includes(account.role || '')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        if (!event.recording_url) {
            return NextResponse.json({ error: 'Gravação não disponível' }, { status: 400 });
        }

        if (event.youtube_url) {
            return NextResponse.json({ youtube_url: event.youtube_url });
        }

        if (!process.env.YOUTUBE_REFRESH_TOKEN) {
            return NextResponse.json({ error: 'YouTube não configurado' }, { status: 500 });
        }

        event.youtube_upload_status = 'uploading';
        await event.save();

        try {
            const youtubeUrl = await uploadToYouTube(
                event.recording_url,
                event.title,
                `Gravação da live "${event.title}" na comunidade.`
            );

            event.youtube_url = youtubeUrl;
            event.youtube_upload_status = 'done';
            await event.save();

            return NextResponse.json({ youtube_url: youtubeUrl });
        } catch (err) {
            console.error('[upload-youtube] Erro no upload:', err);
            event.youtube_upload_status = 'failed';
            await event.save();
            return NextResponse.json(
                { error: 'Falha no upload para o YouTube' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[api/lives/[liveId]/upload-youtube POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

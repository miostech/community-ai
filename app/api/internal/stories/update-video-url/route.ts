import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import Story from '@/models/Story';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function handleUpdate(request: NextRequest) {
    let body: { video_url_fragment?: string; new_video_url?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Corpo da requisição inválido' },
            { status: 400 }
        );
    }

    const videoUrlFragment = typeof body.video_url_fragment === 'string'
        ? body.video_url_fragment.trim()
        : '';
    const newVideoUrl = typeof body.new_video_url === 'string'
        ? body.new_video_url.trim()
        : '';

    if (!videoUrlFragment || !newVideoUrl) {
        return NextResponse.json(
            { error: 'video_url_fragment e new_video_url são obrigatórios e não podem estar vazios' },
            { status: 400 }
        );
    }

    await connectMongo();

    const regex = new RegExp(escapeRegex(videoUrlFragment), 'i');
    const story = await Story.findOne({
        media_type: 'video',
        media_url: { $regex: regex },
    });

    if (!story) {
        return NextResponse.json(
            { error: 'Nenhum story encontrado com media_url (vídeo) contendo o fragmento informado' },
            { status: 404 }
        );
    }

    story.media_url = newVideoUrl;
    await story.save();

    return NextResponse.json({
        success: true,
        story: {
            id: story._id.toString(),
            media_url: story.media_url,
        },
    });
}

export async function PATCH(request: NextRequest) {
    try {
        return await handleUpdate(request);
    } catch (error) {
        console.error('Erro ao atualizar media_url do story:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        return await handleUpdate(request);
    } catch (error) {
        console.error('Erro ao atualizar media_url do story:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

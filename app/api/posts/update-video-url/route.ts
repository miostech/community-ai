import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';

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
    const post = await Post.findOne({ video_url: { $regex: regex } });

    if (!post) {
        return NextResponse.json(
            { error: 'Nenhum post encontrado com video_url contendo o fragmento informado' },
            { status: 404 }
        );
    }

    post.video_url = newVideoUrl;
    await post.save();

    return NextResponse.json({
        success: true,
        post: {
            id: post._id.toString(),
            video_url: post.video_url,
        },
    });
}

export async function PATCH(request: NextRequest) {
    try {
        return await handleUpdate(request);
    } catch (error) {
        console.error('Erro ao atualizar video_url:', error);
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
        console.error('Erro ao atualizar video_url:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

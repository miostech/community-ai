import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import StoryModel from '@/models/Story';

const AZURE_CONNECTION_STRING = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();
const CONTAINER_IMAGES = (process.env.AZURE_STORAGE_CONTAINER_POSTS_IMAGES || 'ai-community-posts-images').trim();
const CONTAINER_VIDEOS = (process.env.AZURE_STORAGE_CONTAINER_POSTS_VIDEOS || 'ai-community-posts-videos').trim();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB (igual ao feed)

/** POST - Upload de um story (imagem ou vídeo). Aceita FormData (arquivo) ou JSON (mediaUrl após upload via SAS). */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    const contentType = request.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    let mediaUrl: string;
    let mediaType: 'image' | 'video';
    let text: string | undefined;
    let text_x: number | undefined;
    let text_y: number | undefined;

    if (isJson) {
      // Fluxo: cliente já fez upload via SAS; só registra o story
      const body = await request.json();
      const url = (body.mediaUrl as string)?.trim();
      const type = body.mediaType as string;
      if (!url || (type !== 'image' && type !== 'video')) {
        return NextResponse.json({ error: 'mediaUrl e mediaType (image ou video) são obrigatórios' }, { status: 400 });
      }
      mediaUrl = url;
      mediaType = type as 'image' | 'video';
      text = (body.text as string)?.trim() || undefined;
      const tx = body.text_x;
      const ty = body.text_y;
      text_x = tx != null && tx !== '' ? Math.min(100, Math.max(0, Number(tx))) : undefined;
      text_y = ty != null && ty !== '' ? Math.min(100, Math.max(0, Number(ty))) : undefined;
    } else {
      // Fluxo legado: FormData com arquivo (pode falhar em payload > limite da hospedagem)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const textVal = (formData.get('text') as string)?.trim() ?? '';
      const textX = formData.get('text_x');
      const textY = formData.get('text_y');
      text = textVal || undefined;
      text_x = textX != null && textX !== '' ? Math.min(100, Math.max(0, Number(textX))) : undefined;
      text_y = textY != null && textY !== '' ? Math.min(100, Math.max(0, Number(textY))) : undefined;
      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
      }

      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) {
        return NextResponse.json(
          { error: 'Tipo não permitido. Use imagem (JPG, PNG, WebP, GIF) ou vídeo (MP4, WebM, MOV).' },
          { status: 400 }
        );
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Imagem muito grande. Máximo 10MB.' }, { status: 400 });
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: 'Vídeo muito grande. Máximo 500MB.' }, { status: 400 });
      }

      if (!AZURE_CONNECTION_STRING) {
        return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
      }

      await connectMongo();
      const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
      if (!account) {
        return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
      }

      const accountIdStr = account._id.toString();
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
      const containerName = isImage ? CONTAINER_IMAGES : CONTAINER_VIDEOS;
      const containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists({ access: 'blob' });

      const rawExt = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const ext = rawExt && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'].includes(rawExt)
        ? rawExt === 'jpeg' ? 'jpg' : rawExt
        : (isImage ? 'jpg' : 'mp4');
      const blobName = `stories/${accountIdStr}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: { blobContentType: file.type },
      });
      mediaUrl = blockBlobClient.url;
      mediaType = isImage ? 'image' : 'video';
    }

    await connectMongo();
    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    await StoryModel.create({
      account_id: account._id,
      media_url: mediaUrl,
      media_type: mediaType,
      ...(text ? { text } : {}),
      ...(text_x != null && !Number.isNaN(text_x) ? { text_x } : {}),
      ...(text_y != null && !Number.isNaN(text_y) ? { text_y } : {}),
    });

    return NextResponse.json({
      success: true,
      message: 'Story publicado! Ele aparece no seu perfil por 24 horas.',
    });
  } catch (error) {
    console.error('Erro ao publicar story:', error);
    return NextResponse.json(
      { error: 'Erro ao publicar story' },
      { status: 500 }
    );
  }
}

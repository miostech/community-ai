import { NextRequest, NextResponse } from 'next/server';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const dynamic = 'force-dynamic';

const AZURE_CONNECTION_STRING = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();
const CONTAINER_IMAGES = (process.env.AZURE_STORAGE_CONTAINER_POSTS_IMAGES || 'ai-community-posts-images').trim();
const CONTAINER_VIDEOS = (process.env.AZURE_STORAGE_CONTAINER_POSTS_VIDEOS || 'ai-community-posts-videos').trim();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB (igual ao feed)

function parseConnectionString(connectionString: string) {
  const parts: Record<string, string> = {};
  connectionString.split(';').forEach((part) => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) parts[key] = valueParts.join('=');
  });
  return { accountName: parts['AccountName'] || '', accountKey: parts['AccountKey'] || '' };
}

/** POST - Gera URL SAS para upload direto do story (evita limite de payload da função). */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

    const body = await request.json();
    const { type, fileName, contentType, fileSize } = body;

    if (!type || !fileName || !contentType) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const isImage = type === 'image';
    const isVideo = type === 'video';
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use "image" ou "video".' },
        { status: 400 }
      );
    }

    if (isImage) {
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Tipo de imagem não permitido' }, { status: 400 });
      }
      if (fileSize && fileSize > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Imagem muito grande. Máximo 10MB.' }, { status: 400 });
      }
    } else {
      if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Tipo de vídeo não permitido. Use MP4, WebM ou MOV.' }, { status: 400 });
      }
      if (fileSize && fileSize > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: 'Vídeo muito grande. Máximo 500MB.' }, { status: 400 });
      }
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
    const { accountName, accountKey } = parseConnectionString(AZURE_CONNECTION_STRING);
    if (!accountName || !accountKey) {
      return NextResponse.json({ error: 'Erro de configuração do Azure' }, { status: 500 });
    }

    const containerName = isImage ? CONTAINER_IMAGES : CONTAINER_VIDEOS;
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: 'blob' });

    const rawExt = (fileName.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const ext =
      rawExt && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'].includes(rawExt)
        ? rawExt === 'jpeg'
          ? 'jpg'
          : rawExt
        : isImage
          ? 'jpg'
          : 'mp4';
    const blobName = `stories/${accountIdStr}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + 30);
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('cw'),
        expiresOn,
        contentType,
      },
      sharedKeyCredential
    ).toString();

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const sasUrl = `${blockBlobClient.url}?${sasToken}`;
    const finalUrl = blockBlobClient.url;

    return NextResponse.json({
      success: true,
      sasUrl,
      finalUrl,
      mediaType: isImage ? 'image' : 'video',
      expiresAt: expiresOn.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar URL de upload para story:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL de upload' }, { status: 500 });
  }
}

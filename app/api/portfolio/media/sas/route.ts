import { NextRequest, NextResponse } from 'next/server';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const AZURE_CONNECTION_STRING = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();
const CONTAINER_PORTFOLIO_VIDEOS = (
  process.env.AZURE_STORAGE_CONTAINER_PORTFOLIO_VIDEOS || 'ai-community-portfolio-videos'
).trim();

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

function parseConnectionString(connectionString: string) {
  const parts: Record<string, string> = {};
  connectionString.split(';').forEach((part) => {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      parts[key] = valueParts.join('=');
    }
  });
  return {
    accountName: parts['AccountName'] || '',
    accountKey: parts['AccountKey'] || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as any).auth_user_id || session.user.id;
    const body = await request.json();
    const { fileName, contentType, fileSize } = body;

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Tipo de vídeo não permitido' }, { status: 400 });
    }

    if (fileSize && fileSize > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'Vídeo muito grande. Máximo 100MB.' }, { status: 400 });
    }

    if (!AZURE_CONNECTION_STRING) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
    }

    const { accountName, accountKey } = parseConnectionString(AZURE_CONNECTION_STRING);
    if (!accountName || !accountKey) {
      return NextResponse.json({ error: 'Erro de configuração do Azure' }, { status: 500 });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_PORTFOLIO_VIDEOS);

    await containerClient.createIfNotExists({ access: 'blob' });

    const extension = fileName.split('.').pop() || 'mp4';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const blobName = `${authUserId}/${timestamp}-${random}.${extension}`;

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + 30);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER_PORTFOLIO_VIDEOS,
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

    return NextResponse.json({ sasUrl, finalUrl, blobName, expiresAt: expiresOn.toISOString() });
  } catch (error) {
    console.error('Erro ao gerar SAS URL para portfólio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

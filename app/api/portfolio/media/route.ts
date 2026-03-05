import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const AZURE_CONNECTION_STRING = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();
const CONTAINER_PORTFOLIO_VIDEOS = (
  process.env.AZURE_STORAGE_CONTAINER_PORTFOLIO_VIDEOS || 'ai-community-portfolio-videos'
).trim();

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as any).auth_user_id || session.user.id;
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    // Security: only allow deleting files that belong to this user
    if (!url.includes(`/${authUserId}/`)) {
      return NextResponse.json({ error: 'Sem permissão para deletar este arquivo' }, { status: 403 });
    }

    if (!AZURE_CONNECTION_STRING) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_PORTFOLIO_VIDEOS);

    const urlParts = url.split(`${CONTAINER_PORTFOLIO_VIDEOS}/`);
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    const blobName = decodeURIComponent(urlParts[1]);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar vídeo de portfólio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

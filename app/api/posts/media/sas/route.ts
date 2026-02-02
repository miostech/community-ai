import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Configuração do Azure Blob Storage
const AZURE_CONNECTION_STRING = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();
const CONTAINER_IMAGES = (process.env.AZURE_STORAGE_CONTAINER_POSTS_IMAGES || 'ai-community-posts-images').trim();
const CONTAINER_VIDEOS = (process.env.AZURE_STORAGE_CONTAINER_POSTS_VIDEOS || 'ai-community-posts-videos').trim();

// Extrair account name e key da connection string
function parseConnectionString(connectionString: string) {
    const parts: Record<string, string> = {};
    connectionString.split(';').forEach(part => {
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

// POST - Gerar SAS URL para upload direto
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        const body = await request.json();
        const { type, fileName, contentType, fileSize } = body;

        if (!type || !fileName || !contentType) {
            return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
        }

        // Validações
        if (type === 'video') {
            const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
            if (!allowedTypes.includes(contentType)) {
                return NextResponse.json({ error: 'Tipo de vídeo não permitido' }, { status: 400 });
            }
            if (fileSize && fileSize > 500 * 1024 * 1024) {
                return NextResponse.json({ error: 'Vídeo muito grande. Máximo 500MB.' }, { status: 400 });
            }
        } else if (type === 'image') {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(contentType)) {
                return NextResponse.json({ error: 'Tipo de imagem não permitido' }, { status: 400 });
            }
            if (fileSize && fileSize > 10 * 1024 * 1024) {
                return NextResponse.json({ error: 'Imagem muito grande. Máximo 10MB.' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
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

        const containerName = type === 'video' ? CONTAINER_VIDEOS : CONTAINER_IMAGES;
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Garantir que o container existe
        await containerClient.createIfNotExists({ access: 'blob' });

        // Gerar nome único do blob
        const extension = fileName.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const blobName = `${authUserId}/${timestamp}-${random}.${extension}`;

        // Gerar SAS token com permissão de escrita (válido por 30 minutos)
        const expiresOn = new Date();
        expiresOn.setMinutes(expiresOn.getMinutes() + 30);

        const sasToken = generateBlobSASQueryParameters({
            containerName,
            blobName,
            permissions: BlobSASPermissions.parse('cw'), // create + write
            expiresOn,
            contentType,
        }, sharedKeyCredential).toString();

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const sasUrl = `${blockBlobClient.url}?${sasToken}`;
        const finalUrl = blockBlobClient.url; // URL pública final (sem SAS)

        return NextResponse.json({
            success: true,
            sasUrl,        // URL com SAS para upload
            finalUrl,      // URL final do arquivo (para salvar no post)
            blobName,
            expiresAt: expiresOn.toISOString(),
        });

    } catch (error) {
        console.error('Erro ao gerar SAS URL:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

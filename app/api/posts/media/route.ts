import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';

// Configuração do Azure Blob Storage (via variáveis de ambiente)
const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const CONTAINER_IMAGES = process.env.AZURE_STORAGE_CONTAINER_POSTS_IMAGES || 'ai-community-posts-images';
const CONTAINER_VIDEOS = process.env.AZURE_STORAGE_CONTAINER_POSTS_VIDEOS || 'ai-community-posts-videos';

// Limites
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB por imagem
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB por vídeo
const MAX_IMAGES = 10;

// Tipos permitidos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];

// POST - Upload de imagens ou vídeo
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        const formData = await request.formData();
        const mediaType = formData.get('type') as string; // 'image' ou 'video'
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        if (!AZURE_CONNECTION_STRING) {
            console.error('AZURE_STORAGE_CONNECTION_STRING não configurada');
            return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
        const uploadedUrls: string[] = [];

        // Upload de IMAGENS
        if (mediaType === 'image') {
            if (files.length > MAX_IMAGES) {
                return NextResponse.json(
                    { error: `Máximo de ${MAX_IMAGES} imagens por upload` },
                    { status: 400 }
                );
            }

            const containerClient = blobServiceClient.getContainerClient(CONTAINER_IMAGES);
            await containerClient.createIfNotExists({ access: 'blob' });

            for (const file of files) {
                // Validar tipo
                if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    return NextResponse.json(
                        { error: `Tipo de arquivo não permitido: ${file.name}. Use JPG, PNG, WebP ou GIF.` },
                        { status: 400 }
                    );
                }

                // Validar tamanho
                if (file.size > MAX_IMAGE_SIZE) {
                    return NextResponse.json(
                        { error: `Arquivo muito grande: ${file.name}. Máximo 10MB por imagem.` },
                        { status: 400 }
                    );
                }

                // Gerar nome único
                const extension = file.name.split('.').pop() || 'jpg';
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 8);
                const blobName = `${authUserId}/${timestamp}-${random}.${extension}`;

                // Upload
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                await blockBlobClient.upload(buffer, buffer.length, {
                    blobHTTPHeaders: {
                        blobContentType: file.type,
                    },
                });

                uploadedUrls.push(blockBlobClient.url);
            }

            return NextResponse.json({
                success: true,
                type: 'image',
                urls: uploadedUrls,
                count: uploadedUrls.length,
            });
        }

        // Upload de VÍDEO
        if (mediaType === 'video') {
            if (files.length > 1) {
                return NextResponse.json(
                    { error: 'Apenas 1 vídeo por upload' },
                    { status: 400 }
                );
            }

            const file = files[0];

            // Validar tipo
            if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: 'Tipo de vídeo não permitido. Use MP4, WebM ou MOV.' },
                    { status: 400 }
                );
            }

            // Validar tamanho
            if (file.size > MAX_VIDEO_SIZE) {
                return NextResponse.json(
                    { error: 'Vídeo muito grande. Máximo 500MB.' },
                    { status: 400 }
                );
            }

            const containerClient = blobServiceClient.getContainerClient(CONTAINER_VIDEOS);
            await containerClient.createIfNotExists({ access: 'blob' });

            // Gerar nome único
            const extension = file.name.split('.').pop() || 'mp4';
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const blobName = `${authUserId}/${timestamp}-${random}.${extension}`;

            // Upload
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: {
                    blobContentType: file.type,
                },
            });

            return NextResponse.json({
                success: true,
                type: 'video',
                url: blockBlobClient.url,
            });
        }

        return NextResponse.json(
            { error: 'Tipo inválido. Use "image" ou "video".' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Erro no upload de mídia:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE - Remover mídia do Azure
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        const { url, type } = await request.json();

        if (!url || !type) {
            return NextResponse.json({ error: 'URL e tipo são obrigatórios' }, { status: 400 });
        }

        // Verificar se o arquivo pertence ao usuário (segurança)
        if (!url.includes(`/${authUserId}/`)) {
            return NextResponse.json({ error: 'Sem permissão para deletar este arquivo' }, { status: 403 });
        }

        if (!AZURE_CONNECTION_STRING) {
            return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
        const containerName = type === 'video' ? CONTAINER_VIDEOS : CONTAINER_IMAGES;
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Extrair nome do blob da URL
        const urlParts = url.split(`${containerName}/`);
        if (urlParts.length < 2) {
            return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
        }

        const blobName = decodeURIComponent(urlParts[1]);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.deleteIfExists();

        return NextResponse.json({ success: true, message: 'Arquivo removido' });
    } catch (error) {
        console.error('Erro ao deletar mídia:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

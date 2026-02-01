import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

// Configuração do Azure Blob Storage (via variáveis de ambiente)
const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'ai-community-perfil';

// POST - Upload de avatar
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        // Receber o arquivo
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.' },
                { status: 400 }
            );
        }

        // Validar tamanho (max 500MB para imagens 4K)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo 500MB.' }, { status: 400 });
        }

        // Criar nome único para o arquivo
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `avatars/${authUserId}-${Date.now()}.${fileExtension}`;

        // Converter File para Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload para Azure Blob Storage
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Criar container se não existir
        await containerClient.createIfNotExists({
            access: 'blob', // Acesso público para leitura
        });

        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: {
                blobContentType: file.type,
            },
        });

        // URL pública do avatar
        const avatarUrl = blockBlobClient.url;

        // Atualizar avatar no MongoDB
        await connectMongo();

        const account = await Account.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: { avatar_url: avatarUrl } },
            { new: true }
        );

        if (!account) {
            // Deletar o blob se a conta não existir
            await blockBlobClient.deleteIfExists();
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            avatar_url: avatarUrl,
            message: 'Avatar atualizado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao fazer upload do avatar:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE - Remover avatar
export async function DELETE() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        // Buscar conta para pegar URL do avatar atual
        const account = await Account.findOne({ auth_user_id: authUserId });

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Se tem avatar, deletar do Azure
        if (account.avatar_url && account.avatar_url.includes('nuvfitstorage')) {
            try {
                const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
                const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

                // Extrair nome do blob da URL
                const url = new URL(account.avatar_url);
                const blobName = url.pathname.split(`/${CONTAINER_NAME}/`)[1];

                if (blobName) {
                    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                    await blockBlobClient.deleteIfExists();
                }
            } catch (blobError) {
                console.error('Erro ao deletar blob:', blobError);
                // Continua mesmo se falhar ao deletar o blob
            }
        }

        // Atualizar conta removendo avatar_url
        await Account.findOneAndUpdate({ auth_user_id: authUserId }, { $set: { avatar_url: null } });

        return NextResponse.json({
            success: true,
            message: 'Avatar removido com sucesso',
        });
    } catch (error) {
        console.error('Erro ao remover avatar:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

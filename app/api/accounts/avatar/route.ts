import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

const AZURE_CONNECTION_STRING = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();
const CONTAINER_AVATARS = (process.env.AZURE_STORAGE_CONTAINER_ACCOUNTS_AVATARS || 'ai-community-accounts-avatars').trim();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getBlobNameFromUrl(url: string, containerName: string): string | null {
    const parts = url.split(`/${containerName}/`);
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
}

function isOwnedAzureAvatarUrl(url: string, authUserId: string): boolean {
    return url.includes(`/${CONTAINER_AVATARS}/`) && url.includes(`/${authUserId}/`);
}

// POST - Upload de avatar no Azure Blob Storage
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.' },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
        }

        if (!AZURE_CONNECTION_STRING) {
            return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_AVATARS);
        await containerClient.createIfNotExists({ access: 'blob' });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const extension = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const blobName = `${authUserId}/${timestamp}-${random}.${extension}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: {
                blobContentType: file.type,
            },
        });

        const avatarUrl = blockBlobClient.url;

        await connectMongo();

        const existingAccount = await Account.findOne({ auth_user_id: authUserId }).select('avatar_url');

        if (!existingAccount) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const previousAvatarUrl = existingAccount.avatar_url as string | null | undefined;

        const account = await Account.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: { avatar_url: avatarUrl } },
            { new: true }
        );

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        if (previousAvatarUrl && isOwnedAzureAvatarUrl(previousAvatarUrl, authUserId)) {
            const previousBlobName = getBlobNameFromUrl(previousAvatarUrl, CONTAINER_AVATARS);
            if (previousBlobName) {
                await containerClient.getBlockBlobClient(previousBlobName).deleteIfExists();
            }
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

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId }).select('avatar_url');

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const currentAvatarUrl = account.avatar_url as string | null | undefined;

        if (currentAvatarUrl && AZURE_CONNECTION_STRING && isOwnedAzureAvatarUrl(currentAvatarUrl, authUserId)) {
            const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(CONTAINER_AVATARS);
            const blobName = getBlobNameFromUrl(currentAvatarUrl, CONTAINER_AVATARS);

            if (blobName) {
                await containerClient.getBlockBlobClient(blobName).deleteIfExists();
            }
        }

        await Account.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: { avatar_url: null } }
        );

        return NextResponse.json({
            success: true,
            message: 'Avatar removido com sucesso',
        });
    } catch (error) {
        console.error('Erro ao remover avatar:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

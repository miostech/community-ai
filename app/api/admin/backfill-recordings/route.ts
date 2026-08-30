import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RECORDING_CONTAINER = 'ai-community-live-recordings';

export async function POST(_request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as Record<string, unknown>).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean() as { _id: unknown; role?: string } | null;

        if (!account || account.role !== 'admin') {
            return NextResponse.json({ error: 'Apenas admins' }, { status: 403 });
        }

        const azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!azureConnStr) {
            return NextResponse.json({ error: 'AZURE_STORAGE_CONNECTION_STRING não configurado' }, { status: 503 });
        }

        const match = azureConnStr.match(/AccountName=([^;]+)/);
        if (!match) {
            return NextResponse.json({ error: 'AccountName não encontrado na connection string' }, { status: 503 });
        }

        const accountName = match[1];
        const blobService = BlobServiceClient.fromConnectionString(azureConnStr);
        const container = blobService.getContainerClient(RECORDING_CONTAINER);

        const endedLives = await LiveEvent.find({
            status: 'ended',
            $or: [
                { recording_url: { $exists: false } },
                { recording_url: null },
                { recording_url: '' },
            ],
        }).select('_id egress_id').lean() as { _id: { toString(): string }; egress_id?: string }[];

        const results: { liveId: string; status: string }[] = [];

        for (const live of endedLives) {
            const liveId = live._id.toString();
            const blobName = `lives/${liveId}.mp4`;

            try {
                const blob = container.getBlobClient(blobName);
                const exists = await blob.exists();

                if (exists) {
                    const url = `https://${accountName}.blob.core.windows.net/${RECORDING_CONTAINER}/${blobName}`;
                    await LiveEvent.updateOne({ _id: live._id }, { $set: { recording_url: url } });
                    results.push({ liveId, status: 'found_and_saved' });
                } else {
                    results.push({ liveId, status: 'file_not_found' });
                }
            } catch (err) {
                console.error(`[backfill] Erro ao verificar ${liveId}:`, err);
                results.push({ liveId, status: 'error' });
            }
        }

        const saved = results.filter((r) => r.status === 'found_and_saved').length;
        const notFound = results.filter((r) => r.status === 'file_not_found').length;

        return NextResponse.json({
            success: true,
            total_checked: endedLives.length,
            recordings_found: saved,
            not_found: notFound,
            results,
        });
    } catch (error) {
        console.error('[api/admin/backfill-recordings POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

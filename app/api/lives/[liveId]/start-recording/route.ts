import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { EgressClient, EncodedFileOutput, EncodedFileType, AzureBlobUpload } from 'livekit-server-sdk';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';

const RECORDING_CONTAINER = 'ai-community-live-recordings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ liveId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { liveId } = await params;
        if (!mongoose.Types.ObjectId.isValid(liveId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const authUserId = (session.user as Record<string, unknown>).auth_user_id || session.user.id;
        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId })
            .select('_id role')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const staffRoles = ['moderator', 'admin', 'criador'];
        if (!staffRoles.includes(account.role || '')) {
            return NextResponse.json({ error: 'Apenas staff pode iniciar gravação manual' }, { status: 403 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        if (event.status !== 'live') {
            return NextResponse.json({ error: 'Live não está ao vivo' }, { status: 400 });
        }

        if (event.egress_id) {
            return NextResponse.json({ error: 'Gravação já está em andamento', egress_id: event.egress_id }, { status: 400 });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        const azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING;

        const missing: string[] = [];
        if (!apiKey) missing.push('LIVEKIT_API_KEY');
        if (!apiSecret) missing.push('LIVEKIT_API_SECRET');
        if (!livekitUrl) missing.push('NEXT_PUBLIC_LIVEKIT_URL');
        if (!azureConnStr) missing.push('AZURE_STORAGE_CONNECTION_STRING');

        if (missing.length > 0) {
            return NextResponse.json({
                error: 'Variáveis de ambiente faltando',
                missing,
            }, { status: 503 });
        }

        const match = azureConnStr!.match(/AccountName=([^;]+)/);
        const keyMatch = azureConnStr!.match(/AccountKey=([^;]+)/);
        if (!match || !keyMatch) {
            return NextResponse.json({ error: 'Connection string do Azure inválida' }, { status: 503 });
        }

        const blobService = BlobServiceClient.fromConnectionString(azureConnStr!);
        const containerClient = blobService.getContainerClient(RECORDING_CONTAINER);
        await containerClient.createIfNotExists({ access: 'blob' });

        const egressClient = new EgressClient(livekitUrl!, apiKey!, apiSecret!);
        const output = new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: `lives/${liveId}.mp4`,
            output: {
                case: 'azure' as const,
                value: new AzureBlobUpload({
                    accountName: match[1],
                    accountKey: keyMatch[1],
                    containerName: RECORDING_CONTAINER,
                }),
            },
        });

        const egressInfo = await egressClient.startRoomCompositeEgress(event.room_name, output);
        event.egress_id = egressInfo.egressId;
        await event.save();

        return NextResponse.json({
            success: true,
            egress_id: egressInfo.egressId,
            message: 'Gravação iniciada com sucesso',
        });
    } catch (error) {
        console.error('[api/lives/[liveId]/start-recording POST]', error);
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

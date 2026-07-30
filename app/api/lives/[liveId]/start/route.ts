import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { EgressClient, EncodedFileOutput, EncodedFileType, AzureBlobUpload } from 'livekit-server-sdk';
import { BlobServiceClient } from '@azure/storage-blob';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';
import Account from '@/models/Account';
import { createNotification } from '@/lib/notifications';

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
            .select('_id')
            .lean() as { _id: mongoose.Types.ObjectId } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        if (event.creator_id.toString() !== account._id.toString()) {
            return NextResponse.json({ error: 'Apenas o criador pode iniciar a live' }, { status: 403 });
        }

        if (event.status === 'live') {
            return NextResponse.json({ error: 'Esta live já está ao vivo' }, { status: 400 });
        }

        if (event.status === 'ended' || event.status === 'cancelled') {
            return NextResponse.json({ error: 'Esta live já foi encerrada' }, { status: 400 });
        }

        event.status = 'live';
        event.started_at = new Date();
        await event.save();

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        const azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING;

        if (apiKey && apiSecret && livekitUrl && azureConnStr) {
            try {
                const match = azureConnStr.match(/AccountName=([^;]+)/);
                const keyMatch = azureConnStr.match(/AccountKey=([^;]+)/);
                if (match && keyMatch) {
                    const blobService = BlobServiceClient.fromConnectionString(azureConnStr);
                    const containerClient = blobService.getContainerClient(RECORDING_CONTAINER);
                    await containerClient.createIfNotExists({ access: 'blob' });

                    const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
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
                }
            } catch (err) {
                console.error('[start] Erro ao iniciar gravação:', err);
            }
        }

        const recipients = await Account.find({ _id: { $ne: account._id } })
            .select('_id')
            .lean() as { _id: mongoose.Types.ObjectId }[];

        const contentPreview = event.title.slice(0, 150);

        for (const rec of recipients) {
            createNotification({
                recipientId: rec._id,
                actorId: account._id,
                type: 'live_started',
                liveEventId: event._id,
                contentPreview,
            }).catch((err) => console.error('[live notification]', err));
        }

        return NextResponse.json({ success: true, event: event.toObject() });
    } catch (error) {
        console.error('[api/lives/[liveId]/start POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

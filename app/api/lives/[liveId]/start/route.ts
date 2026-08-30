import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { EgressClient, EncodedFileOutput, EncodedFileType, AzureBlobUpload, RoomServiceClient } from 'livekit-server-sdk';
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
            .select('_id role')
            .lean() as { _id: mongoose.Types.ObjectId; role?: string } | null;

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const event = await LiveEvent.findById(liveId);
        if (!event) {
            return NextResponse.json({ error: 'Live não encontrada' }, { status: 404 });
        }

        const staffRoles = ['moderator', 'admin', 'criador'];
        const isCreator = event.creator_id.toString() === account._id.toString();
        if (!isCreator && !staffRoles.includes(account.role || '')) {
            return NextResponse.json({ error: 'Sem permissão para iniciar esta live' }, { status: 403 });
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

        const missingVars: string[] = [];
        if (!apiKey) missingVars.push('LIVEKIT_API_KEY');
        if (!apiSecret) missingVars.push('LIVEKIT_API_SECRET');
        if (!livekitUrl) missingVars.push('NEXT_PUBLIC_LIVEKIT_URL');
        if (!azureConnStr) missingVars.push('AZURE_STORAGE_CONNECTION_STRING');

        if (missingVars.length > 0) {
            console.error('[start] Variáveis de ambiente faltando para gravação:', missingVars.join(', '));
        }

        if (apiKey && apiSecret && livekitUrl && azureConnStr) {
            try {
                const match = azureConnStr.match(/AccountName=([^;]+)/);
                const keyMatch = azureConnStr.match(/AccountKey=([^;]+)/);
                if (match && keyMatch) {
                    const blobService = BlobServiceClient.fromConnectionString(azureConnStr);
                    const containerClient = blobService.getContainerClient(RECORDING_CONTAINER);
                    await containerClient.createIfNotExists({ access: 'blob' });

                    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
                    await roomService.createRoom({ name: event.room_name, emptyTimeout: 60 * 60 * 3 });
                    console.log('[start] Sala criada no LiveKit:', event.room_name);

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
                    console.log('[start] Gravação iniciada, egress_id:', egressInfo.egressId);
                }
            } catch (err) {
                console.error('[start] Erro ao iniciar gravação:', err);
            }
        }

        if (!event.staff_only) {
            const contentPreview = event.title.slice(0, 150);
            const reservations: mongoose.Types.ObjectId[] = event.reservations || [];

            if (reservations.length > 0) {
                for (const recipientId of reservations) {
                    if (recipientId.toString() === account._id.toString()) continue;
                    createNotification({
                        recipientId,
                        actorId: account._id,
                        type: 'live_started',
                        liveEventId: event._id,
                        contentPreview,
                    }).catch((err) => console.error('[live notification]', err));
                }
            }
        }

        return NextResponse.json({ success: true, event: event.toObject() });
    } catch (error) {
        console.error('[api/lives/[liveId]/start POST]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

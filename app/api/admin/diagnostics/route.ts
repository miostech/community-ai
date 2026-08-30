import { NextRequest, NextResponse } from 'next/server';
import { EgressClient } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
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

        if (!account || !['admin', 'moderator', 'criador'].includes(account.role || '')) {
            return NextResponse.json({ error: 'Apenas staff' }, { status: 403 });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        const azureConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING;

        const envCheck = {
            LIVEKIT_API_KEY: apiKey ? `set (${apiKey.slice(0, 4)}...)` : 'MISSING',
            LIVEKIT_API_SECRET: apiSecret ? `set (${apiSecret.slice(0, 4)}...)` : 'MISSING',
            NEXT_PUBLIC_LIVEKIT_URL: livekitUrl || 'MISSING',
            AZURE_STORAGE_CONNECTION_STRING: azureConnStr ? `set (AccountName=${azureConnStr.match(/AccountName=([^;]+)/)?.[1] || '?'})` : 'MISSING',
        };

        let activeEgresses: unknown[] = [];
        let egressError: string | null = null;

        if (apiKey && apiSecret && livekitUrl) {
            try {
                const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
                const list = await egressClient.listEgress({});
                activeEgresses = list.map((e) => ({
                    egressId: e.egressId,
                    status: e.status,
                    roomName: e.roomName,
                }));
            } catch (err) {
                egressError = err instanceof Error ? err.message : String(err);
            }
        }

        return NextResponse.json({
            envCheck,
            activeEgresses,
            egressError,
        });
    } catch (error) {
        console.error('[api/admin/diagnostics GET]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

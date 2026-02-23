import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/community/mention-users?q=...
 * Lista usuários da comunidade que podem ser mencionados (@).
 * Retorna id, nome e handle (Instagram, TikTok ou YouTube) para autocomplete.
 * Query "q" opcional: filtra por nome ou handle (case-insensitive).
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get('q') || '').trim().toLowerCase();

        // Buscar contas que tenham pelo menos um link (qualquer valor não vazio)
        const accounts = await Account.find({})
            .select('_id first_name last_name link_instagram link_tiktok link_youtube')
            .lean();

        const users: { id: string; name: string; handle: string }[] = [];

        for (const acc of accounts) {
            const insta = (acc as { link_instagram?: string }).link_instagram?.trim() || '';
            const tiktok = (acc as { link_tiktok?: string }).link_tiktok?.trim() || '';
            const yt = (acc as { link_youtube?: string }).link_youtube?.trim() || '';
            const handle = insta || tiktok || yt;
            if (!handle) continue;

            const name = [acc.first_name, acc.last_name].filter(Boolean).join(' ').trim() || 'Usuário';

            if (q) {
                const matchName = name.toLowerCase().includes(q);
                const matchHandle = handle.toLowerCase().includes(q);
                if (!matchName && !matchHandle) continue;
            }

            users.push({
                id: (acc as { _id: { toString: () => string } })._id.toString(),
                name,
                handle: handle.replace(/^@/, ''),
            });
        }

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Erro ao listar usuários para menção:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

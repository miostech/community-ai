import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Account from '@/models/Account';
import PollVote from '@/models/PollVote';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Votar em uma opção da enquete (ou trocar voto)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { postId } = await params;
        let body: { option_index?: number };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
        }

        const option_index = typeof body.option_index === 'number' ? body.option_index : undefined;
        if (option_index === undefined || option_index < 0) {
            return NextResponse.json({ error: 'option_index é obrigatório e deve ser >= 0' }, { status: 400 });
        }

        const authUserId = (session.user as { auth_user_id?: string; id?: string }).auth_user_id || session.user.id;
        await connectMongo();

        const postObjectId = new mongoose.Types.ObjectId(postId);
        const post = await Post.findById(postObjectId).lean();
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        const poll_options = (post as { poll_options?: { text: string; votes_count: number }[] }).poll_options;
        const poll_question = (post as { poll_question?: string }).poll_question;
        if (!poll_question || !poll_options || poll_options.length === 0) {
            return NextResponse.json(
                {
                    error: 'Este post não tem enquete. Pode ser um post antigo — tente atualizar o feed e votar em um post com enquete.',
                },
                { status: 400 }
            );
        }

        if (option_index >= poll_options.length) {
            return NextResponse.json({ error: 'Opção inválida' }, { status: 400 });
        }

        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const accountId = (account as { _id: mongoose.Types.ObjectId })._id;
        const existingVote = await PollVote.findOne({
            post_id: postObjectId,
            account_id: accountId,
        });

        const updates: Record<string, number> = {};
        if (existingVote) {
            const oldIndex = existingVote.option_index;
            if (oldIndex !== option_index) {
                updates[`poll_options.${oldIndex}.votes_count`] = -1;
                updates[`poll_options.${option_index}.votes_count`] = 1;
                existingVote.option_index = option_index;
                await existingVote.save();
            }
        } else {
            updates[`poll_options.${option_index}.votes_count`] = 1;
            await PollVote.create({
                post_id: postObjectId,
                account_id: accountId,
                option_index,
            });
        }

        if (Object.keys(updates).length > 0) {
            await Post.findByIdAndUpdate(postObjectId, { $inc: updates });
        }

        const updated = await Post.findById(postObjectId).select('poll_options').lean();
        const options = (updated as { poll_options?: { text: string; votes_count: number }[] })?.poll_options ?? poll_options;

        return NextResponse.json({
            success: true,
            poll_options: options,
            poll_vote_index: option_index,
        });
    } catch (error) {
        console.error('Erro ao votar na enquete:', error);
        return NextResponse.json({ error: 'Erro ao registrar voto' }, { status: 500 });
    }
}

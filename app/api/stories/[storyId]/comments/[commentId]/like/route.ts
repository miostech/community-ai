import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import StoryCommentModel from '@/models/StoryComment';
import { createNotification } from '@/lib/notifications';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { storyId, commentId } = await params;
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: 'ID do comentário inválido' }, { status: 400 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const accountId = account._id as mongoose.Types.ObjectId;

    const comment = await StoryCommentModel.findByIdAndUpdate(
      commentId,
      { $addToSet: { likes: accountId } },
      { new: true }
    );

    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    if (comment.author_id.toString() !== accountId.toString()) {
      await createNotification({
        recipientId: comment.author_id,
        actorId: accountId,
        type: 'story_comment',
        storyId: new mongoose.Types.ObjectId(storyId),
        contentPreview: `curtiu seu comentário: "${comment.content.slice(0, 80)}"`,
      });
    }

    return NextResponse.json({ success: true, likes_count: comment.likes.length });
  } catch (error) {
    console.error('Erro ao curtir comentário do story:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { commentId } = await params;
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: 'ID do comentário inválido' }, { status: 400 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const accountId = account._id as mongoose.Types.ObjectId;

    const comment = await StoryCommentModel.findByIdAndUpdate(
      commentId,
      { $pull: { likes: accountId } },
      { new: true }
    );

    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, likes_count: comment.likes.length });
  } catch (error) {
    console.error('Erro ao descurtir comentário do story:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

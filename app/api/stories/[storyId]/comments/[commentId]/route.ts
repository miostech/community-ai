import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import StoryCommentModel from '@/models/StoryComment';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const comment = await StoryCommentModel.findById(commentId).lean();
    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    const accountId = (account._id as mongoose.Types.ObjectId).toString();
    if (comment.author_id.toString() !== accountId) {
      return NextResponse.json({ error: 'Sem permissão para apagar este comentário' }, { status: 403 });
    }

    await StoryCommentModel.findByIdAndDelete(commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao apagar comentário do story:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

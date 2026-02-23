import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import StoryModel from '@/models/Story';
import mongoose from 'mongoose';

/** DELETE - Remove um story. Só o dono pode apagar. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    const { storyId } = await params;

    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'ID do story inválido' }, { status: 400 });
    }

    await connectMongo();
    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const story = await StoryModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(storyId),
      account_id: account._id,
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story não encontrado ou você não pode apagá-lo' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Story excluído.' });
  } catch (error) {
    console.error('Erro ao excluir story:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir story' },
      { status: 500 }
    );
  }
}

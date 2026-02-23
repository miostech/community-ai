import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import StoryModel from '@/models/Story';
import StoryViewModel from '@/models/StoryView';
import mongoose from 'mongoose';

/** POST - Registra que o usuário logado visualizou este story (idempotente: 1 view por usuário por story). */
export async function POST(
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

    const story = await StoryModel.findOne({
      _id: new mongoose.Types.ObjectId(storyId),
    })
      .select('account_id')
      .lean();

    if (!story) {
      return NextResponse.json({ error: 'Story não encontrado' }, { status: 404 });
    }

    const viewerId = account._id;
    const ownerId = story.account_id;
    if (viewerId.equals(ownerId)) {
      return NextResponse.json({ success: true, message: 'Próprio story' });
    }

    await StoryViewModel.updateOne(
      { story_id: new mongoose.Types.ObjectId(storyId), viewer_account_id: viewerId },
      { $setOnInsert: { story_id: new mongoose.Types.ObjectId(storyId), viewer_account_id: viewerId } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar visualização do story:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar visualização' },
      { status: 500 }
    );
  }
}

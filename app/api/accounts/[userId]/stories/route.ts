import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import StoryModel, { STORY_EXPIRY_HOURS } from '@/models/Story';
import Like from '@/models/Like';
import Account from '@/models/Account';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

/** GET - Lista stories do usuário (perfil público). Só retorna os das últimas 24h. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectMongo();

    const since = new Date(Date.now() - STORY_EXPIRY_HOURS * 60 * 60 * 1000);

    const stories = await StoryModel.find({
      account_id: new mongoose.Types.ObjectId(userId),
      created_at: { $gte: since },
    })
      .sort({ created_at: 1 })
      .lean();

    let likedStoryIds = new Set<string>();
    const session = await auth();
    if (session?.user?.id && stories.length > 0) {
      const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
      const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
      if (account) {
        const storyIds = stories.map((s) => s._id);
        const likes = await Like.find({
          user_id: account._id,
          target_type: 'story',
          target_id: { $in: storyIds },
        })
          .select('target_id')
          .lean();
        likes.forEach((l) => likedStoryIds.add(l.target_id.toString()));
      }
    }

    const list = stories.map((s) => ({
      id: s._id.toString(),
      media_url: s.media_url,
      media_type: s.media_type,
      text: s.text ?? '',
      text_x: s.text_x,
      text_y: s.text_y,
      likes_count: s.likes_count ?? 0,
      liked: likedStoryIds.has(s._id.toString()),
      created_at: s.created_at,
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error('Erro ao listar stories:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar stories' },
      { status: 500 }
    );
  }
}

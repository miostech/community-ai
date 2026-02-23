import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import StoryModel, { STORY_EXPIRY_HOURS } from '@/models/Story';
import StoryViewModel from '@/models/StoryView';
import mongoose from 'mongoose';

/** GET - Lista quem e quantas pessoas viram os stories do usuário. Só o dono da conta pode consultar. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    const { userId } = await params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
    }

    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account || account._id.toString() !== userId) {
      return NextResponse.json({ error: 'Só você pode ver quem visualizou seus stories' }, { status: 403 });
    }

    const since = new Date(Date.now() - STORY_EXPIRY_HOURS * 60 * 60 * 1000);
    const myStories = await StoryModel.find({
      account_id: new mongoose.Types.ObjectId(userId),
      created_at: { $gte: since },
    })
      .select('_id')
      .lean();

    const storyIds = myStories.map((s) => s._id);
    if (storyIds.length === 0) {
      return NextResponse.json({ viewsByStory: {} });
    }

    const views = await StoryViewModel.find({ story_id: { $in: storyIds } })
      .sort({ viewed_at: -1 })
      .populate('viewer_account_id', 'first_name last_name avatar_url')
      .lean();

    const viewsByStory: Record<
      string,
      { count: number; viewers: { id: string; name: string; avatar: string | null; viewed_at: string }[] }
    > = {};

    for (const sid of storyIds) {
      viewsByStory[sid.toString()] = { count: 0, viewers: [] };
    }

    for (const v of views as any[]) {
      const storyIdStr = v.story_id?.toString?.() ?? v.story_id;
      const viewer = v.viewer_account_id;
      const viewerId = viewer?._id?.toString();
      if (!storyIdStr || !viewerId || !viewsByStory[storyIdStr]) continue;

      const fullName = viewer?.last_name
        ? `${viewer?.first_name ?? ''} ${viewer?.last_name ?? ''}`.trim()
        : viewer?.first_name ?? '';

      viewsByStory[storyIdStr].count += 1;
      viewsByStory[storyIdStr].viewers.push({
        id: viewerId,
        name: fullName || 'Usuário',
        avatar: viewer?.avatar_url ?? null,
        viewed_at: v.viewed_at ? new Date(v.viewed_at).toISOString() : '',
      });
    }

    return NextResponse.json({ viewsByStory });
  } catch (error) {
    console.error('Erro ao buscar visualizações dos stories:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar visualizações' },
      { status: 500 }
    );
  }
}

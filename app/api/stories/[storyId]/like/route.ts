import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Like from '@/models/Like';
import StoryModel from '@/models/Story';
import Account from '@/models/Account';
import { createNotification, removeNotification } from '@/lib/notifications';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) return String((err as { message: unknown }).message);
  return String(err);
}

// POST - Toggle like em um story
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { storyId } = await params;
    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'ID do story inválido' }, { status: 400 });
    }

    await connectMongo();

    const storyObjectId = new mongoose.Types.ObjectId(storyId);

    let story: { account_id: mongoose.Types.ObjectId; likes_count?: number; text?: string } | null;
    try {
      story = await StoryModel.findById(storyObjectId).lean();
    } catch (err) {
      throw new Error(`story_find: ${toErrorMessage(err)}`);
    }
    if (!story) {
      return NextResponse.json({ error: 'Story não encontrado' }, { status: 404 });
    }

    let account: { _id: mongoose.Types.ObjectId } | null;
    try {
      account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    } catch (err) {
      throw new Error(`account_find: ${toErrorMessage(err)}`);
    }
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const accountId = new mongoose.Types.ObjectId(account._id.toString());
    const storyOwnerId = new mongoose.Types.ObjectId(story.account_id.toString());

    const existingLike = await Like.findOne({
      user_id: accountId,
      target_type: 'story',
      target_id: storyObjectId,
    });

    let liked: boolean;
    let likesCount: number;
    const currentCount = story.likes_count ?? 0;

    if (existingLike) {
      try {
        await Like.findByIdAndDelete(existingLike._id);
        await StoryModel.findByIdAndUpdate(storyObjectId, { $inc: { likes_count: -1 } });
      } catch (err) {
        throw new Error(`unlike: ${toErrorMessage(err)}`);
      }
      liked = false;
      likesCount = Math.max(0, currentCount - 1);

      try {
        await removeNotification({
          recipientId: storyOwnerId,
          actorId: accountId,
          type: 'like',
          storyId: storyObjectId,
        });
      } catch (notifErr) {
        console.error('Remover notificação de like no story falhou:', notifErr);
      }
    } else {
      try {
        await Like.create({
          user_id: accountId,
          target_type: 'story',
          target_id: storyObjectId,
        });
        await StoryModel.findByIdAndUpdate(storyObjectId, { $inc: { likes_count: 1 } });
      } catch (err) {
        throw new Error(`like_create: ${toErrorMessage(err)}`);
      }
      liked = true;
      likesCount = currentCount + 1;

      try {
        await createNotification({
          recipientId: storyOwnerId,
          actorId: accountId,
          type: 'like',
          storyId: storyObjectId,
          contentPreview: story.text?.slice(0, 100) ?? null,
        });
      } catch (notifErr) {
        console.error('Notificação de like no story falhou (like foi salvo):', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      liked,
      likes_count: likesCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Erro ao processar like no story:', message, stack ?? '');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}

// GET - Verificar se o usuário deu like em um story
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false });
    }

    const { storyId } = await params;
    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ liked: false });
    }

    await connectMongo();

    const storyObjectId = new mongoose.Types.ObjectId(storyId);

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ liked: false });
    }

    const existingLike = await Like.findOne({
      user_id: account._id,
      target_type: 'story',
      target_id: storyObjectId,
    });

    return NextResponse.json({
      liked: !!existingLike,
    });
  } catch (error) {
    console.error('Erro ao verificar like no story:', error);
    return NextResponse.json({ liked: false });
  }
}

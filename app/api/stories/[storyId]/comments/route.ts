import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import StoryModel from '@/models/Story';
import StoryCommentModel from '@/models/StoryComment';
import { createNotification } from '@/lib/notifications';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'ID do story inválido' }, { status: 400 });
    }

    await connectMongo();

    const comments = await StoryCommentModel.find({ story_id: new mongoose.Types.ObjectId(storyId) })
      .sort({ created_at: 1 })
      .limit(200)
      .populate('author_id', 'first_name last_name avatar_url')
      .lean();

    const formatted = comments.map((c) => {
      const author = c.author_id as unknown as {
        _id: mongoose.Types.ObjectId;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
      } | null;
      return {
        id: c._id.toString(),
        content: c.content,
        created_at: c.created_at.toISOString(),
        author: {
          id: author?._id?.toString() || '',
          name: author
            ? [author.first_name || '', author.last_name || ''].join(' ').trim() || 'Alguém'
            : 'Alguém',
          avatar_url: author?.avatar_url || null,
        },
      };
    });

    return NextResponse.json({ comments: formatted });
  } catch (error) {
    console.error('Erro ao buscar comentários do story:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { storyId } = await params;
    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'ID do story inválido' }, { status: 400 });
    }

    const body = await request.json();
    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'Comentário não pode estar vazio' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'Comentário muito longo (máx 500 caracteres)' }, { status: 400 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id first_name last_name avatar_url').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const storyObjectId = new mongoose.Types.ObjectId(storyId);
    const story = await StoryModel.findById(storyObjectId).select('account_id').lean();
    if (!story) {
      return NextResponse.json({ error: 'Story não encontrado' }, { status: 404 });
    }

    const accountId = account._id as mongoose.Types.ObjectId;
    const comment = await StoryCommentModel.create({
      story_id: storyObjectId,
      author_id: accountId,
      content,
    });

    await createNotification({
      recipientId: story.account_id,
      actorId: accountId,
      type: 'story_comment',
      storyId: storyObjectId,
      contentPreview: content.slice(0, 150),
    });

    const acc = account as unknown as {
      _id: mongoose.Types.ObjectId;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };

    return NextResponse.json({
      success: true,
      comment: {
        id: comment._id.toString(),
        content: comment.content,
        created_at: comment.created_at.toISOString(),
        author: {
          id: acc._id.toString(),
          name: [acc.first_name || '', acc.last_name || ''].join(' ').trim() || 'Alguém',
          avatar_url: acc.avatar_url || null,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar comentário no story:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

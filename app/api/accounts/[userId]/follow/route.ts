import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import AccountModel from '@/models/Account';
import SocialFollowModel from '@/models/SocialFollow';
import mongoose from 'mongoose';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { userId: followedUserId } = await params;
        if (!followedUserId || !mongoose.Types.ObjectId.isValid(followedUserId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        await connectMongo();

        const followerAccount = await AccountModel.findOne({ auth_user_id: session.user.id })
            .select('_id')
            .lean();

        if (!followerAccount) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const followerId = followerAccount._id.toString();
        if (followerId === followedUserId) {
            return NextResponse.json({ created: false });
        }

        const result = await SocialFollowModel.updateOne(
            {
                follower_id: followerAccount._id,
                followed_id: new mongoose.Types.ObjectId(followedUserId),
            },
            { $setOnInsert: { follower_id: followerAccount._id, followed_id: new mongoose.Types.ObjectId(followedUserId) } },
            { upsert: true }
        );

        return NextResponse.json({ created: result.upsertedCount > 0 });
    } catch (error) {
        console.error('Erro ao registrar follow:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

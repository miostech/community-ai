import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

// POST - Upload de avatar (salva como data URL em base64 no MongoDB)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.' },
                { status: 400 }
            );
        }

        const maxSize = 10 * 1024 * 1024; // 10MB (base64 no MongoDB; para arquivos maiores use storage externo)
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mime = file.type.split(';')[0].trim() || 'image/jpeg';
        const avatarUrl = `data:${mime};base64,${base64}`;

        await connectMongo();

        const account = await Account.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: { avatar_url: avatarUrl } },
            { new: true }
        );

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            avatar_url: avatarUrl,
            message: 'Avatar atualizado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao fazer upload do avatar:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE - Remover avatar
export async function DELETE() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;

        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId });

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        await Account.findOneAndUpdate(
            { auth_user_id: authUserId },
            { $set: { avatar_url: null } }
        );

        return NextResponse.json({
            success: true,
            message: 'Avatar removido com sucesso',
        });
    } catch (error) {
        console.error('Erro ao remover avatar:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

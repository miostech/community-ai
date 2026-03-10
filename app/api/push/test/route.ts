import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import { sendPushToUser } from '@/lib/push-notifications';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/push/test
 * Envia uma notificação de teste para o usuário logado.
 * Use para validar se o push está funcionando (em Perfil > Notificações no celular).
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    await connectMongo();

    const account = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const accountId = account._id as mongoose.Types.ObjectId;
    const result = await sendPushToUser(accountId, {
      title: 'Teste Dome',
      body: 'Se você está vendo isso, as notificações estão funcionando!',
      url: '/dashboard/comunidade',
      tag: 'test',
    });

    if (result.sent === 0 && result.failed === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum dispositivo inscrito. Ative as notificações no celular em Meu Perfil.',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      message: result.sent > 0
        ? 'Enviada! Se não aparecer: minimize a janela ou mude de aba (navegadores costumam não mostrar notificação com a aba do site em foco). Confira também o ícone de notificações do sistema.'
        : 'Nenhuma notificação foi entregue (subscription pode ter expirado).',
    });
  } catch (error) {
    console.error('Erro ao enviar push de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificação de teste' },
      { status: 500 }
    );
  }
}

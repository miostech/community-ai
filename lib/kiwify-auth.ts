/**
 * Lógica compartilhada do login Kiwify.
 * Usada pelo provider Credentials e pela API de validação (para retornar erro claro ao cliente).
 */
import { connectMongo } from '@/lib/mongoose';
import { hasKiwifyPurchase } from '@/lib/kiwify';
import { hashPassword, verifyPassword } from '@/lib/password';
import Account from '@/models/Account';

function splitName(name?: string | null): { first_name: string; last_name: string } {
  if (!name?.trim()) return { first_name: '', last_name: '' };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts.at(-1) ?? '',
  };
}

export type KiwifyAuthUser = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string | null;
  image: string | null;
};

export type KiwifyAuthResult =
  | { ok: true; user: KiwifyAuthUser }
  | { ok: false; error: string };

/**
 * Valida email + senha e cria/atualiza conta Kiwify se necessário.
 * Retorna o user para o NextAuth ou uma mensagem de erro para exibir na tela.
 */
export async function validateKiwifyCredentials(
  email: string,
  password: string
): Promise<KiwifyAuthResult> {
  const emailNorm = email?.trim()?.toLowerCase() ?? '';
  const passwordStr = typeof password === 'string' ? password : String(password ?? '');

  if (!emailNorm) {
    return { ok: false, error: 'Digite o email usado na compra.' };
  }
  if (!passwordStr) {
    return { ok: false, error: 'Digite uma senha.' };
  }
  if (passwordStr.length < 6) {
    return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  try {
    await connectMongo();
    const authUserId = `kiwify:${emailNorm}`;
    const existing = await Account.findOne({ auth_user_id: authUserId })
      .select('+password_hash')
      .lean();

    if (existing?.password_hash) {
      if (!verifyPassword(passwordStr, existing.password_hash)) {
        return { ok: false, error: 'Senha incorreta. Use a senha que você cadastrou anteriormente.' };
      }
      await Account.updateOne(
        { auth_user_id: authUserId },
        { $set: { last_access_at: new Date() } }
      );
      return {
        ok: true,
        user: {
          id: existing._id.toString(),
          auth_user_id: existing.auth_user_id,
          name: [existing.first_name, existing.last_name].filter(Boolean).join(' ') || emailNorm,
          email: existing.email ?? emailNorm,
          image: existing.avatar_url || null,
        },
      };
    }

    const { hasAccess, customerName } = await hasKiwifyPurchase(emailNorm);
    if (!hasAccess) {
      return {
        ok: false,
        error: 'Nenhuma compra encontrada para este email. Use o mesmo email da sua compra na Kiwify.',
      };
    }

    const { first_name, last_name } = splitName(customerName);

    const passwordHash = hashPassword(passwordStr);
    const savedAccount = await Account.findOneAndUpdate(
      { auth_user_id: authUserId },
      {
        $setOnInsert: {
          auth_user_id: authUserId,
          first_name: first_name || 'Usuário',
          last_name: last_name || '',
          provider_oauth: 'kiwify',
          plan: 'free',
        },
        $set: {
          email: emailNorm,
          password_hash: passwordHash,
          last_access_at: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return {
      ok: true,
      user: {
        id: savedAccount._id.toString(),
        auth_user_id: savedAccount.auth_user_id,
        name: [savedAccount.first_name, savedAccount.last_name].filter(Boolean).join(' ') || emailNorm,
        email: savedAccount.email ?? emailNorm,
        image: savedAccount.avatar_url || null,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao validar login.';
    return { ok: false, error: `Erro no servidor: ${message}. Tente novamente.` };
  }
}

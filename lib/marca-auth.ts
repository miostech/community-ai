import { connectMongo } from '@/lib/mongoose';
import { verifyPassword } from '@/lib/password';
import Account from '@/models/Account';

export type MarcaAuthUser = {
    id: string;
    auth_user_id: string;
    name: string;
    email: string | null;
    image: string | null;
};

export type MarcaAuthResult = { ok: true; user: MarcaAuthUser } | { ok: false; error: string };

export function marcaAuthUserId(emailNorm: string): string {
    return `marca:${emailNorm}`;
}

export async function validateMarcaCredentials(email: string, password: string): Promise<MarcaAuthResult> {
    const emailNorm = email?.trim()?.toLowerCase() ?? '';
    const passwordStr = typeof password === 'string' ? password : String(password ?? '');

    if (!emailNorm) {
        return { ok: false, error: 'Digite seu email.' };
    }
    if (!passwordStr) {
        return { ok: false, error: 'Digite sua senha.' };
    }

    try {
        await connectMongo();
        const authUserId = marcaAuthUserId(emailNorm);
        const existing = await Account.findOne({ auth_user_id: authUserId }).select('+password_hash').lean();

        if (!existing?.password_hash) {
            return { ok: false, error: 'Conta não encontrada ou senha não cadastrada. Use o mesmo email do cadastro de marca.' };
        }

        if (!verifyPassword(passwordStr, existing.password_hash)) {
            return { ok: false, error: 'Senha incorreta.' };
        }

        await Account.updateOne({ auth_user_id: authUserId }, { $set: { last_access_at: new Date() } });

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
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao validar login.';
        return { ok: false, error: `Erro no servidor: ${message}. Tente novamente.` };
    }
}

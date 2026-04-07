import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import { hashPassword } from '@/lib/password';
import { marcaAuthUserId } from '@/lib/marca-auth';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function splitName(full: string): { first_name: string; last_name: string } {
    const t = full.trim();
    if (!t) return { first_name: '', last_name: '' };
    const parts = t.split(/\s+/);
    if (parts.length === 1) return { first_name: parts[0], last_name: '' };
    return { first_name: parts.slice(0, -1).join(' '), last_name: parts.at(-1) ?? '' };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!fullName || fullName.length < 3) {
            return NextResponse.json({ error: 'Informe o nome completo (mínimo 3 caracteres).' }, { status: 400 });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 });
        }

        await connectMongo();
        const authUserId = marcaAuthUserId(email);

        const exists = await Account.findOne({
            $or: [{ auth_user_id: authUserId }, { email }],
        })
            .select('auth_user_id email')
            .lean();

        if (exists) {
            if (exists.auth_user_id === authUserId) {
                return NextResponse.json({ error: 'Este email já está cadastrado no portal da marca. Faça login.' }, { status: 409 });
            }
            return NextResponse.json(
                { error: 'Este email já está em uso. Use outro email ou entre com Google se for sua conta.' },
                { status: 409 }
            );
        }

        const { first_name, last_name } = splitName(fullName);
        const passwordHash = hashPassword(password);

        await Account.create({
            auth_user_id: authUserId,
            email,
            first_name: first_name || 'Marca',
            last_name: last_name || '',
            provider_oauth: 'marca',
            password_hash: passwordHash,
            role: 'marca',
            plan: 'free',
            last_access_at: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('marca/register:', e);
        return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 });
    }
}

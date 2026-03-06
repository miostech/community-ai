import jwt from 'jsonwebtoken';
import NextAuth from 'next-auth';
import Apple from 'next-auth/providers/apple';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

import { connectMongo } from '@/lib/mongoose';
import { validateKiwifyCredentials } from '@/lib/kiwify-auth';
import Account from '@/models/Account';

function splitName(name?: string | null): { first: string; last: string } {
    if (!name) return { first: '', last: '' };
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts.slice(0, -1).join(' '), last: parts.at(-1) ?? '' };
}

// Gera o client secret para Apple OAuth (JWT assinado) — lazy para não crashar no build
let _appleClientSecret: string | null = null;
function generateAppleClientSecret(): string {
    if (_appleClientSecret) return _appleClientSecret;

    const teamId = process.env.APPLE_TEAM_ID?.trim() || '';
    const clientId = process.env.APPLE_CLIENT_ID?.trim() || '';
    const keyId = process.env.APPLE_KEY_ID?.trim() || '';
    const privateKey = (process.env.APPLE_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');

    if (!privateKey) {
        console.warn('⚠️ APPLE_PRIVATE_KEY não configurada — Apple OAuth desabilitado');
        return '';
    }

    console.log('🍎 Apple OAuth Config:', {
        teamId,
        clientId,
        keyId,
        privateKeyLength: privateKey?.length,
        privateKeyStart: privateKey?.substring(0, 50),
    });

    const now = Math.floor(Date.now() / 1000);

    try {
        const token = jwt.sign(
            {
                iss: teamId,
                iat: now,
                exp: now + 86400 * 180, // 180 dias
                aud: 'https://appleid.apple.com',
                sub: clientId,
            },
            privateKey,
            {
                algorithm: 'ES256',
                header: { alg: 'ES256', kid: keyId },
            }
        );

        console.log('🍎 Apple JWT gerado com sucesso, tamanho:', token.length);
        _appleClientSecret = token;
        return token;
    } catch (error) {
        console.error('❌ Erro ao gerar Apple JWT:', error);
        return '';
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Apple({
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: generateAppleClientSecret(),
        }),
        Credentials({
            id: 'kiwify',
            name: 'Email da compra (Kiwify)',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                const creds = credentials ?? {};
                const email = (typeof creds.email === 'string' ? creds.email : (creds as { get?: (k: string) => string | null }).get?.('email') ?? '').trim().toLowerCase();
                const passwordRaw = typeof creds.password === 'string' ? creds.password : (creds as { get?: (k: string) => string | null }).get?.('password') ?? '';
                const password = typeof passwordRaw === 'string' ? passwordRaw : String(passwordRaw ?? '');
                const result = await validateKiwifyCredentials(email, password);
                return result.ok ? result.user : null;
            },
        }),
        Credentials({
            id: 'test',
            name: 'Login de teste',
            credentials: {
                auth_user_id: { label: 'Auth User ID', type: 'text' },
            },
            async authorize(credentials) {
                const authUserId = credentials?.auth_user_id as string | undefined;
                console.log('🧪 Tentativa de login de teste:', { authUserId });

                if (!authUserId) {
                    console.log('❌ auth_user_id não fornecido');
                    return null;
                }

                try {
                    await connectMongo();
                    const account = await Account.findOne({ auth_user_id: authUserId });
                    console.log('🔍 Conta encontrada:', account ? account._id : 'NÃO ENCONTRADA');

                    if (!account) {
                        console.log('❌ Usuário não existe no banco - login de teste só funciona para usuários existentes');
                        return null;
                    }

                    await Account.updateOne(
                        { auth_user_id: authUserId },
                        { $set: { last_access_at: new Date() } }
                    );
                    return {
                        id: account._id.toString(),
                        auth_user_id: account.auth_user_id,
                        name: [account.first_name, account.last_name].filter(Boolean).join(' ') || 'Usuário',
                        email: null,
                        image: account.avatar_url || null,
                    };
                } catch (err) {
                    console.error('❌ Erro no login de teste:', err);
                    return null;
                }
            },
        }),
    ],
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
        error: '/login', // Redireciona erros para login
    },
    // Força o uso de cookies seguros apenas em produção
    useSecureCookies: process.env.NODE_ENV === 'production',
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log('🔐 SignIn callback iniciado:', {
                provider: account?.provider,
                providerAccountId: account?.providerAccountId,
                userId: user?.id,
                userEmail: user?.email,
                userName: user?.name,
                profileEmail: (profile as Record<string, string>)?.email,
            });

            // Para providers Credentials (kiwify/test), o account já foi tratado no authorize()
            if (account?.provider === 'credentials' || account?.provider === 'kiwify' || account?.provider === 'test') {
                console.log('✅ Provider credentials/kiwify/test - retornando true');
                return true;
            }

            // OAuth (Google/Apple) - precisa do providerAccountId
            if (!account?.providerAccountId) {
                console.log('❌ Sem providerAccountId - retornando false');
                return false;
            }

            const authUserId = account.providerAccountId;
            const providerOAuth = account.provider;
            const { first, last } = splitName(user.name);

            console.log('🔐 SignIn OAuth - salvando no MongoDB:', { authUserId, providerOAuth, first, last, email: user.email });

            try {
                await connectMongo();
                console.log('✅ Conectado ao MongoDB');

                // Pega o email do usuário (Apple pode não enviar em logins subsequentes)
                const userEmail = user.email || (profile as Record<string, string>)?.email || '';

                // Primeiro, verifica se a conta já existe
                const existingAccount = await Account.findOne({ auth_user_id: authUserId });

                if (existingAccount) {
                    // Conta existe - NÃO sobrescreve first_name/last_name (respeita o nome editado pelo usuário no perfil)
                    const updateFields: Record<string, unknown> = {
                        provider_oauth: providerOAuth,
                        last_access_at: new Date(),
                    };

                    // Só atualiza email se ainda não tiver um
                    if (!existingAccount.email && userEmail) {
                        updateFields.email = userEmail;
                    }

                    await Account.updateOne(
                        { auth_user_id: authUserId },
                        { $set: updateFields }
                    );
                    console.log('✅ Account atualizado (nome preservado):', existingAccount._id, 'email:', existingAccount.email || userEmail);
                } else {
                    // Conta não existe - cria nova
                    const newAccount = await Account.create({
                        auth_user_id: authUserId,
                        email: userEmail,
                        first_name: first || (profile as Record<string, string>)?.given_name || '',
                        last_name: last || (profile as Record<string, string>)?.family_name || '',
                        provider_oauth: providerOAuth,
                        avatar_url: user.image ?? '',
                        plan: 'free',
                        last_access_at: new Date(),
                    });
                    console.log('✅ Account criado:', newAccount._id, 'email:', newAccount.email);
                }
            } catch (err) {
                console.error('❌ Erro ao salvar conta no MongoDB:', err);
            }

            return true;
        },
        async jwt({ token, account, user }) {
            if ((account?.provider === 'credentials' || account?.provider === 'kiwify') && user?.auth_user_id) {
                token.auth_user_id = user.auth_user_id;
                token.sub = user.id;
            } else if (account) {
                // OAuth (Google/Apple) - usa o providerAccountId
                token.auth_user_id = account.providerAccountId;
            }
            if (user?.id) {
                token.sub = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).id = token.sub;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).auth_user_id = token.auth_user_id;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            console.log('🔄 Redirect callback:', { url, baseUrl });

            // Se a URL começa com /, é uma URL relativa - redireciona para ela
            if (url.startsWith('/')) {
                console.log('📍 URL relativa, redirecionando para:', `${baseUrl}${url}`);
                return `${baseUrl}${url}`;
            }

            // Tenta extrair callbackUrl se existir
            try {
                const urlObj = new URL(url);
                const callbackUrl = urlObj.searchParams.get('callbackUrl');
                if (callbackUrl) {
                    console.log('📍 Usando callbackUrl:', callbackUrl);
                    if (callbackUrl.startsWith('/')) {
                        return `${baseUrl}${callbackUrl}`;
                    }
                    if (callbackUrl.startsWith(baseUrl)) {
                        return callbackUrl;
                    }
                }
            } catch {
                // URL inválida, ignora
            }

            // Se a URL é EXATAMENTE o baseUrl (sem path), verifica se há cookie de redirect
            // (Apple OAuth às vezes perde o state do redirectTo)
            if (url === baseUrl || url === `${baseUrl}/`) {
                // Retorna uma URL especial que o middleware/client vai processar para ler o cookie
                console.log('📍 URL é baseUrl puro, verificando se há redirect pendente...');
                return `${baseUrl}/api/auth/post-login-redirect`;
            }

            // Se a URL é do mesmo domínio, permite o redirect
            if (url.startsWith(baseUrl)) {
                console.log('📍 Mesmo domínio, redirecionando para:', url);
                return url;
            }

            // Fallback: redireciona para o dashboard
            console.log('📍 Fallback, redirecionando para:', `${baseUrl}/dashboard`);
            return `${baseUrl}/dashboard`;
        },
    },
});

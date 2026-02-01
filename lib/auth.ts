import jwt from 'jsonwebtoken';
import NextAuth from 'next-auth';
import Apple from 'next-auth/providers/apple';
import Google from 'next-auth/providers/google';

import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

function splitName(name?: string | null): { first: string; last: string } {
    if (!name) return { first: '', last: '' };
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts.slice(0, -1).join(' '), last: parts.at(-1) ?? '' };
}

// Gera o client secret para Apple OAuth (JWT assinado)
function generateAppleClientSecret(): string {
    const teamId = process.env.APPLE_TEAM_ID!;
    const clientId = process.env.APPLE_CLIENT_ID!;
    const keyId = process.env.APPLE_KEY_ID!;
    // Converte \n literal para quebras de linha reais (caso esteja em uma linha só)
    const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

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
        return token;
    } catch (error) {
        console.error('❌ Erro ao gerar Apple JWT:', error);
        throw error;
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
            if (!account?.providerAccountId) return false;

            const authUserId = account.providerAccountId;
            const providerOAuth = account.provider;
            const { first, last } = splitName(user.name);

            console.log('🔐 SignIn callback - salvando no MongoDB:', { authUserId, providerOAuth, first, last });

            try {
                await connectMongo();
                console.log('✅ Conectado ao MongoDB');

                const savedAccount = await Account.findOneAndUpdate(
                    { auth_user_id: authUserId },
                    {
                        $setOnInsert: {
                            auth_user_id: authUserId,
                            code_invite: undefined,
                        },
                        $set: {
                            first_name: first || (profile as Record<string, string>)?.given_name || '',
                            last_name: last || (profile as Record<string, string>)?.family_name || '',
                            avatar_url: user.image ?? '',
                            provider_oauth: providerOAuth,
                            plan: 'free',
                            last_access_at: new Date(),
                        },
                    },
                    { upsert: true, new: true }
                );
                console.log('✅ Account salvo:', savedAccount?._id);
            } catch (err) {
                console.error('❌ Erro ao salvar conta no MongoDB:', err);
            }

            return true;
        },
        async jwt({ token, account, user }) {
            if (account) {
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
            
            // Se a URL é EXATAMENTE o baseUrl (sem path), redireciona para dashboard
            if (url === baseUrl || url === `${baseUrl}/`) {
                console.log('📍 URL é baseUrl puro, redirecionando para dashboard/comunidade');
                return `${baseUrl}/dashboard/comunidade`;
            }
            
            // Se a URL é do mesmo domínio, permite o redirect
            if (url.startsWith(baseUrl)) {
                console.log('📍 Mesmo domínio, redirecionando para:', url);
                return url;
            }
            
            // Fallback: redireciona para o dashboard/comunidade
            console.log('📍 Fallback, redirecionando para:', `${baseUrl}/dashboard/comunidade`);
            return `${baseUrl}/dashboard/comunidade`;
        },
    },
});

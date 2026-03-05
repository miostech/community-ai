'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export interface Account {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_country_code: string;
    link_instagram: string;
    link_tiktok: string;
    link_youtube: string;
    primary_social_link: 'instagram' | 'tiktok' | 'youtube' | null;
    avatar_url: string | null;
    used_instagram_avatar: boolean;
    /** ISO date do último uso do botão "Usar foto do Instagram". Botão reaparece após 24h. */
    instagram_avatar_used_at: string | null;
    background_url: string | null;
    plan: 'free' | 'pro' | 'enterprise';
    code_invite: string | null;
    role?: 'user' | 'moderator' | 'admin' | 'criador';
    is_founding_member?: boolean;
    /** ISO date em que o usuário solicitou o cancelamento da assinatura. */
    request_cancel_at: string | null;
    /** Geolocalização por IP (atualizada ao entrar na comunidade, no máx. a cada 24h) */
    geo_country?: string | null;
    geo_region?: string | null;
    geo_city?: string | null;
    geo_lat?: number | null;
    geo_lon?: number | null;
    geo_updated_at?: string | null;
    birth_date?: string | null;
    gender?: 'masculino' | 'feminino' | 'nao_binario' | 'prefiro_nao_dizer' | null;
    category?: 'ugc' | 'influencer' | 'ambos' | null;
    niches?: string[];
    address_country?: string | null;
    address_state?: string | null;
    address_city?: string | null;
    link_media_kit?: string | null;
    portfolio_videos?: string[];
}

export interface Subscription {
    status: 'active' | 'expired' | 'inactive';
    expires_at: string | null;
    order_status: string | null;
    /** Status bruto da assinatura (payment.subscription.status), ex.: cancelled, cancelado, active */
    subscription_status: string | null;
    product_name: string | null;
    last_payment_at: string | null;
    payment_method: string | null;
    plan_frequency: string | null;
    /** Data do primeiro pagamento aprovado (ISO). Trabalhos libera 7 dias após essa data. */
    first_paid_at: string | null;
}

interface AccountContextType {
    account: Account | null;
    subscription: Subscription | null;
    isLoading: boolean;
    error: string | null;
    refreshAccount: () => Promise<void>;
    updateAccount: (updates: Partial<Account>) => Promise<boolean>;
    /** Atualiza a conta com a resposta de uma API (ex.: sync Instagram avatar) para refletir na UI na hora */
    setAccountFromResponse: (account: Account | null) => void;
    hasPhone: boolean;
    fullName: string;
    isSubscriptionActive: boolean;
    isMidiaKitComplete: boolean;
    /** Data/hora em que a sessão Trabalhos será liberada (7 dias após first_paid_at). null = já liberado ou sem compra. */
    trabalhosUnlockAt: Date | null;
    /** true se o usuário já pode acessar Trabalhos (7 dias após a primeira compra). */
    canAccessTrabalhos: boolean;
    /** Data/hora em que o Chat com IA será liberado (7 dias após first_paid_at). null = já liberado ou sem compra. */
    chatUnlockAt: Date | null;
    /** true se o usuário já pode acessar o Chat com IA (7 dias após a primeira compra). */
    canAccessChat: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Rotas que não requerem assinatura ativa
const PUBLIC_ROUTES = ['/dashboard/assinatura', '/dashboard/perfil'];

export function AccountProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [account, setAccount] = useState<Account | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccount = useCallback(async () => {
        console.log('🟡 fetchAccount chamado - status:', status, 'session:', session?.user);

        if (status !== 'authenticated' || !session?.user) {
            console.log('🔴 Não autenticado ou sem session.user');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('🟢 Buscando /api/accounts...');
            const response = await fetch('/api/accounts');
            console.log('🟢 Response status:', response.status);

            if (!response.ok) {
                if (response.status === 404) {
                    // Conta não encontrada - pode ser um novo usuário
                    console.log('🟠 Conta não encontrada (404)');
                    setAccount(null);
                    return;
                }
                throw new Error('Erro ao carregar dados da conta');
            }

            const data = await response.json();
            console.log('🟢 Dados recebidos da API:', data);
            setAccount(data.account);
            setSubscription(data.subscription || null);
        } catch (err) {
            console.error('🔴 Erro ao carregar conta:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar conta');
        } finally {
            setIsLoading(false);
        }
    }, [session, status]);

    // Carregar conta quando a sessão estiver autenticada
    useEffect(() => {
        if (status === 'authenticated') {
            fetchAccount();
        } else if (status === 'unauthenticated') {
            setAccount(null);
            setSubscription(null);
            setIsLoading(false);
        }
    }, [status, fetchAccount]);

    // Redirecionar para página de assinatura se subscription estiver inativa
    useEffect(() => {
        if (isLoading || !account) return;

        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
        const isDashboardRoute = pathname?.startsWith('/dashboard');

        console.log('🔍 Verificando subscription:', {
            status: subscription?.status,
            isPublicRoute,
            isDashboardRoute,
            pathname,
        });

        // Só redireciona se status for explicitamente 'inactive' ou 'expired'
        const isInactive = subscription?.status === 'inactive' || subscription?.status === 'expired';

        if (isDashboardRoute && !isPublicRoute && isInactive) {
            const isCampaignUser = subscription?.product_name === 'Dome - Campanha 10 dias grátis';
            const destination = isCampaignUser ? '/promo' : '/dashboard/assinatura';
            console.log('🔴 Assinatura inativa - redirecionando para', destination);
            router.push(destination);
        }
    }, [isLoading, account, subscription, pathname, router]);

    const refreshAccount = useCallback(async () => {
        await fetchAccount();
    }, [fetchAccount]);

    const updateAccount = useCallback(async (updates: Partial<Account>): Promise<boolean> => {
        try {
            setError(null);

            const response = await fetch('/api/accounts', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao atualizar conta');
            }

            const data = await response.json();
            setAccount(data.account);
            return true;
        } catch (err) {
            console.error('Erro ao atualizar conta:', err);
            setError(err instanceof Error ? err.message : 'Erro ao atualizar conta');
            return false;
        }
    }, []);

    const setAccountFromResponse = useCallback((accountData: Account | null) => {
        setAccount(accountData);
    }, []);

    const hasPhone = Boolean(account?.phone && account.phone.trim() !== '');
    const fullName = account ? `${account.first_name} ${account.last_name}`.trim() : '';
    const isSubscriptionActive = subscription?.status === 'active';

    const TRABALHOS_UNLOCK_DAYS = 7;
    const firstPaidAt = subscription?.first_paid_at ?? null;
    const trabalhosUnlockAt: Date | null = firstPaidAt
        ? (() => {
            const d = new Date(firstPaidAt);
            d.setDate(d.getDate() + TRABALHOS_UNLOCK_DAYS);
            return d;
        })()
        : null;
    const canAccessTrabalhos = trabalhosUnlockAt === null || Date.now() >= trabalhosUnlockAt.getTime();

    const CHAT_UNLOCK_DAYS = 7;
    const chatUnlockAt: Date | null = firstPaidAt
        ? (() => {
            const d = new Date(firstPaidAt);
            d.setDate(d.getDate() + CHAT_UNLOCK_DAYS);
            return d;
        })()
        : null;
    const canAccessChat = chatUnlockAt === null || Date.now() >= chatUnlockAt.getTime();

    const isMidiaKitComplete = Boolean(
        account?.birth_date &&
        account?.gender &&
        account?.category &&
        account?.niches && account.niches.length > 0 &&
        account?.address_country?.trim() &&
        account?.link_instagram?.trim() &&
        account?.link_tiktok?.trim() &&
        account?.portfolio_videos && account.portfolio_videos.length >= 3
    );

    return (
        <AccountContext.Provider
            value={{
                account,
                subscription,
                isLoading,
                error,
                refreshAccount,
                updateAccount,
                setAccountFromResponse,
                hasPhone,
                fullName,
                isSubscriptionActive,
                isMidiaKitComplete,
                trabalhosUnlockAt,
                canAccessTrabalhos,
                chatUnlockAt,
                canAccessChat,
            }}
        >
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error('useAccount deve ser usado dentro de um AccountProvider');
    }
    return context;
}

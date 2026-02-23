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
}

export interface Subscription {
    status: 'active' | 'expired' | 'inactive';
    expires_at: string | null;
    product_name: string | null;
    last_payment_at: string | null;
    payment_method: string | null;
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
            console.log('🔴 Assinatura inativa - redirecionando para /dashboard/assinatura');
            router.push('/dashboard/assinatura');
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

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Account {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_country_code: string;
    link_instagram: string;
    link_tiktok: string;
    primary_social_link: 'instagram' | 'tiktok' | null;
    avatar_url: string | null;
    background_url: string | null;
    plan: 'free' | 'pro' | 'enterprise';
    code_invite: string | null;
}

interface AccountContextType {
    account: Account | null;
    isLoading: boolean;
    error: string | null;
    refreshAccount: () => Promise<void>;
    updateAccount: (updates: Partial<Account>) => Promise<boolean>;
    hasPhone: boolean;
    fullName: string;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [account, setAccount] = useState<Account | null>(null);
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
            setIsLoading(false);
        }
    }, [status, fetchAccount]);

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

    const hasPhone = Boolean(account?.phone && account.phone.trim() !== '');
    const fullName = account ? `${account.first_name} ${account.last_name}`.trim() : '';

    return (
        <AccountContext.Provider
            value={{
                account,
                isLoading,
                error,
                refreshAccount,
                updateAccount,
                hasPhone,
                fullName,
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

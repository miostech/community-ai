'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { useAccount } from '@/contexts/AccountContext';
import {
    destinationPathFromHref,
    isDashboardRouteAccessibleWithoutSubscription,
} from '@/lib/dashboard-subscription-access';
import { CAMPAIGN_14_DAYS_PRODUCT_NAME } from '@/lib/campaign-product';

interface DashboardPaywallContextValue {
    paywallModalOpen: boolean;
    openPaywallModal: () => void;
    closePaywallModal: () => void;
    /** Navega para href se permitido; caso contrário abre o modal de plano. */
    requestNavigation: (href: string) => void;
    /** Se a navegação para href exigiria plano, previne o default e abre o modal. */
    interceptLinkClick: (e: React.MouseEvent, href: string) => void;
    canAccessDashboardDestination: (href: string) => boolean;
}

const DashboardPaywallContext = createContext<DashboardPaywallContextValue | undefined>(undefined);

function DashboardPaywallModal({
    open,
    onClose,
    onAcquire,
}: {
    open: boolean;
    onClose: () => void;
    onAcquire: () => void;
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Plano necessário</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Para acessar esta área, é preciso ter um plano ativo. Adquira um plano para usar o feed, chat,
                    trabalhos e demais recursos da comunidade.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit">
                    Não
                </Button>
                <Button
                    onClick={onAcquire}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        },
                    }}
                >
                    Adquirir
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function DashboardPaywallProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { status } = useSession();
    const { account, subscription, isLoading, isSubscriptionEffective } = useAccount();
    const [paywallModalOpen, setPaywallModalOpen] = useState(false);

    const canAccessDashboardDestination = useCallback(
        (href: string) => {
            const dest = destinationPathFromHref(href);
            if (isSubscriptionEffective) return true;
            return isDashboardRouteAccessibleWithoutSubscription(dest, account);
        },
        [account, isSubscriptionEffective]
    );

    const openPaywallModal = useCallback(() => setPaywallModalOpen(true), []);
    const closePaywallModal = useCallback(() => setPaywallModalOpen(false), []);

    const requestNavigation = useCallback(
        (href: string) => {
            const dest = destinationPathFromHref(href);
            if (!dest.startsWith('/dashboard')) {
                router.push(href);
                return;
            }
            if (canAccessDashboardDestination(href)) {
                router.push(href);
                return;
            }
            setPaywallModalOpen(true);
        },
        [canAccessDashboardDestination, router]
    );

    const interceptLinkClick = useCallback(
        (e: React.MouseEvent, href: string) => {
            const dest = destinationPathFromHref(href);
            if (!dest.startsWith('/dashboard')) return;
            if (canAccessDashboardDestination(href)) return;
            e.preventDefault();
            setPaywallModalOpen(true);
        },
        [canAccessDashboardDestination]
    );

    const handleAcquire = useCallback(() => {
        const isCampaignUser = subscription?.product_name === CAMPAIGN_14_DAYS_PRODUCT_NAME;
        const plansHref = isCampaignUser ? '/precos' : '/dashboard/assinatura';
        setPaywallModalOpen(false);
        router.push(plansHref);
    }, [router, subscription?.product_name]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        if (isLoading || !account) return;
        if (isSubscriptionEffective) return;
        if (!pathname?.startsWith('/dashboard')) return;
        if (isDashboardRouteAccessibleWithoutSubscription(pathname, account)) return;

        router.replace('/dashboard');
        setPaywallModalOpen(true);
    }, [status, isLoading, account, pathname, isSubscriptionEffective, router]);

    const value = useMemo(
        () => ({
            paywallModalOpen,
            openPaywallModal,
            closePaywallModal,
            requestNavigation,
            interceptLinkClick,
            canAccessDashboardDestination,
        }),
        [
            paywallModalOpen,
            openPaywallModal,
            closePaywallModal,
            requestNavigation,
            interceptLinkClick,
            canAccessDashboardDestination,
        ]
    );

    return (
        <DashboardPaywallContext.Provider value={value}>
            {children}
            <DashboardPaywallModal open={paywallModalOpen} onClose={closePaywallModal} onAcquire={handleAcquire} />
        </DashboardPaywallContext.Provider>
    );
}

export function useDashboardPaywall() {
    const ctx = useContext(DashboardPaywallContext);
    if (!ctx) {
        throw new Error('useDashboardPaywall deve ser usado dentro de DashboardPaywallProvider');
    }
    return ctx;
}

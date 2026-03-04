'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Close as CloseIcon, TrendingUp as UpgradeIcon } from '@mui/icons-material';

const DISMISS_KEY = 'upgrade_banner_dismissed_at';
const FIRST_SEEN_KEY = 'upgrade_banner_first_seen_at';
const CAMPAIGN_DAYS = 7;
const UPGRADE_URL = 'https://pay.kiwify.com.br/tuxuXlK';

function isMonthlyPlan(productName: string | null | undefined, planFrequency: string | null | undefined): boolean {
    if (planFrequency) {
        const freq = planFrequency.toLowerCase();
        if (freq === 'monthly' || freq === 'mensal') return true;
    }
    if (productName) {
        const name = productName.toLowerCase();
        if (name.includes('mensal') || name.includes('monthly')) return true;
    }
    if (planFrequency) {
        const freq = planFrequency.toLowerCase();
        if (freq.includes('month') || freq.includes('mensal') || freq === '1') return true;
    }
    return false;
}

function isCampaignExpired(): boolean {
    try {
        const raw = localStorage.getItem(FIRST_SEEN_KEY);
        if (!raw) return false;
        const firstSeenAt = new Date(raw).getTime();
        if (Number.isNaN(firstSeenAt)) return false;
        const daysSince = (Date.now() - firstSeenAt) / (1000 * 60 * 60 * 24);
        return daysSince >= CAMPAIGN_DAYS;
    } catch {
        return false;
    }
}

function isDismissedToday(): boolean {
    try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (!raw) return false;
        const dismissedAt = new Date(raw);
        if (Number.isNaN(dismissedAt.getTime())) return false;
        const now = new Date();
        return dismissedAt.getFullYear() === now.getFullYear()
            && dismissedAt.getMonth() === now.getMonth()
            && dismissedAt.getDate() === now.getDate();
    } catch {
        return false;
    }
}

function markFirstSeen() {
    try {
        if (!localStorage.getItem(FIRST_SEEN_KEY)) {
            localStorage.setItem(FIRST_SEEN_KEY, new Date().toISOString());
        }
    } catch { /* noop */ }
}

export function UpgradeBanner() {
    const { subscription, isSubscriptionActive, account, isLoading } = useAccount();
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        const expired = isCampaignExpired();
        const dismissedToday = isDismissedToday();
        setHidden(expired || dismissedToday);
        if (!expired && !dismissedToday) {
            markFirstSeen();
        }
    }, []);

    if (isLoading || !isSubscriptionActive || hidden) return null;
    if (new Date() < new Date('2026-03-08T00:00:00-03:00')) return null;
    if (!isMonthlyPlan(subscription?.product_name, subscription?.plan_frequency)) return null;

    const handleDismiss = () => {
        try {
            localStorage.setItem(DISMISS_KEY, new Date().toISOString());
        } catch { /* noop */ }
        setHidden(true);
    };

    const handleUpgrade = () => {
        const url = new URL(UPGRADE_URL);
        if (account?.email) {
            url.searchParams.set('email', account.email);
        }
        window.open(url.toString(), '_blank');
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)',
                color: '#fff',
                position: 'relative',
            }}
        >
            {/* Desktop: linha única */}
            <Box
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, fontSize: '0.8rem', flex: 1, lineHeight: 1.4 }}
                >
                    Oferta exclusiva para membros fundadores: faça upgrade para o plano semestral por <strong>R$ 89,90</strong>. Válido por apenas 7 dias.
                </Typography>
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleUpgrade}
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 1.5,
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        minWidth: 'auto',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                    }}
                >
                    Fazer upgrade
                </Button>
                <IconButton
                    size="small"
                    onClick={handleDismiss}
                    aria-label="Fechar"
                    sx={{
                        color: 'rgba(255,255,255,0.6)',
                        p: 0.25,
                        flexShrink: 0,
                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' },
                    }}
                >
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Mobile: texto + botão embaixo */}
            <Box
                sx={{
                    display: { xs: 'flex', sm: 'none' },
                    flexDirection: 'column',
                    gap: 0.75,
                    px: 1.5,
                    py: 1,
                    pr: 4,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, fontSize: '0.75rem', lineHeight: 1.4 }}
                >
                    Oferta exclusiva para membros fundadores: upgrade para o semestral por <strong>R$ 89,90</strong>. Válido por 7 dias.
                </Typography>
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleUpgrade}
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        textTransform: 'none',
                        alignSelf: 'flex-start',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                    }}
                >
                    Fazer upgrade
                </Button>
            </Box>

            {/* X mobile: canto superior direito */}
            <IconButton
                size="small"
                onClick={handleDismiss}
                aria-label="Fechar"
                sx={{
                    display: { xs: 'flex', sm: 'none' },
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    color: 'rgba(255,255,255,0.6)',
                    p: 0.25,
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' },
                }}
            >
                <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
        </Box>
    );
}

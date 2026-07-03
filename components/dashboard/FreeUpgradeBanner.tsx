'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import { Box, Typography, Button, IconButton } from '@mui/material';
import {
    Close as CloseIcon,
    AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import {
    FLASH_OFFER_EVENT,
    getFreeFlashDeadline,
    isFreeFlashActive,
} from '@/lib/flash-offer';

const DISMISS_KEY = 'free_upgrade_banner_dismissed_at';

function isDismissedToday(): boolean {
    try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (!raw) return false;
        const dismissedAt = new Date(raw);
        if (Number.isNaN(dismissedAt.getTime())) return false;
        const now = new Date();
        return (
            dismissedAt.getFullYear() === now.getFullYear() &&
            dismissedAt.getMonth() === now.getMonth() &&
            dismissedAt.getDate() === now.getDate()
        );
    } catch {
        return false;
    }
}

/**
 * Banner de conversão para usuários cadastrados SEM plano ativo (feed grátis).
 * Promove os recursos pagos (chat com IA, Top Trends, trabalhos) com CTA para assinatura.
 */
export function FreeUpgradeBanner() {
    const router = useRouter();
    const { isSubscriptionEffective, isLoading } = useAccount();
    const [hidden, setHidden] = useState(true);
    // Enquanto a oferta relâmpago (modal/selo) estiver ativa, o banner fica oculto.
    const [flashActive, setFlashActive] = useState(true);

    useEffect(() => {
        setHidden(isDismissedToday());
    }, []);

    const recomputeFlash = useCallback(() => {
        setFlashActive(isFreeFlashActive());
    }, []);

    useEffect(() => {
        recomputeFlash();
        window.addEventListener(FLASH_OFFER_EVENT, recomputeFlash);
        window.addEventListener('storage', recomputeFlash);
        return () => {
            window.removeEventListener(FLASH_OFFER_EVENT, recomputeFlash);
            window.removeEventListener('storage', recomputeFlash);
        };
    }, [recomputeFlash]);

    // Reavalia exatamente quando a oferta expira, para o banner aparecer em seguida.
    useEffect(() => {
        if (!flashActive) return;
        const deadline = getFreeFlashDeadline();
        if (deadline === null) {
            setFlashActive(false);
            return;
        }
        const ms = deadline - Date.now();
        if (ms <= 0) {
            setFlashActive(false);
            return;
        }
        const timer = window.setTimeout(() => setFlashActive(false), ms + 500);
        return () => window.clearTimeout(timer);
    }, [flashActive]);

    if (isLoading || isSubscriptionEffective || hidden || flashActive) return null;

    const handleDismiss = () => {
        try {
            localStorage.setItem(DISMISS_KEY, new Date().toISOString());
        } catch {
            /* noop */
        }
        setHidden(true);
    };

    const handleUpgrade = () => {
        router.push('/dashboard/assinatura');
    };

    const message =
        'Você tem o feed liberado. Desbloqueie o chat com IA, o Top Trends e trabalhos remunerados com marcas.';

    return (
        <Box
            sx={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #9333ea 100%)',
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
                <SparkleIcon sx={{ fontSize: 18, flexShrink: 0 }} />
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, fontSize: '0.8rem', flex: 1, lineHeight: 1.4 }}
                >
                    {message}
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
                    Ver planos
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
                    {message}
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
                    Ver planos
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

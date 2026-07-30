'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    Typography,
    Button,
    IconButton,
    Box,
} from '@mui/material';
import {
    Close as CloseIcon,
    Bolt as BoltIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';
import { CAMPAIGN_14_DAYS_PRODUCT_NAME } from '@/lib/campaign-product';
import {
    type FlashPhase,
    readFlashDeadline,
    writeFlashDeadline,
} from '@/lib/flash-offer';

const KIWIFY_URL = 'https://pay.kiwify.com.br/lL4lc0Y';

/** Janela da oferta relâmpago por usuário (a partir do momento em que ele vê a oferta). */
const FLASH_WINDOW_MS = 30 * 60 * 1000; // 30 minutos

/** Atraso antes de abrir o modal (deixa a pessoa "chegar" na tela antes da oferta). */
const INITIAL_DELAY_MS = 10 * 1000;
const INITIAL_DELAY_LAST_DAY_MS = 3 * 1000;

type Phase = FlashPhase;
type View = 'hidden' | 'modal' | 'pill';

/** Rotas onde a oferta não deve aparecer (já são de compra/onboarding). */
const SUPPRESSED_ROUTES = ['/dashboard/assinatura', '/dashboard/perfil'];

function formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CampaignPromoModal() {
    const {
        account,
        subscription,
        isLoading,
        hasPhone,
        isSubscriptionEffective,
    } = useAccount();
    const pathname = usePathname();

    const [view, setView] = useState<View>('hidden');
    const [remainingMs, setRemainingMs] = useState<number | null>(null);

    const firstName = account?.first_name?.trim() || '';
    const displayName = firstName ? `${firstName}, ` : '';

    const isCampaignUser = subscription?.product_name === CAMPAIGN_14_DAYS_PRODUCT_NAME;
    const isActive = subscription?.status === 'active';

    // Último dia do trial: dia anterior ao expires_at (ex.: expira 30/03 → último dia = 29/03)
    const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
    const isLastDayOfTrial = useMemo(() => {
        if (!expiresAt || Number.isNaN(expiresAt.getTime())) return false;
        const expiryDate = new Date(expiresAt.getFullYear(), expiresAt.getMonth(), expiresAt.getDate());
        const lastDay = new Date(expiryDate);
        lastDay.setDate(lastDay.getDate() - 1);
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return todayDate.getTime() === lastDay.getTime();
    }, [expiresAt]);

    const routeSuppressed = pathname ? SUPPRESSED_ROUTES.includes(pathname) : false;

    // Segmento ativo (mutuamente exclusivos): trial 14 dias OU free pós-graça.
    const phase: Phase | null = useMemo(() => {
        if (isLoading || !hasPhone || routeSuppressed) return null;
        if (isCampaignUser && isActive) {
            return isLastDayOfTrial ? 'trialLastDay' : 'trial';
        }
        if (!isCampaignUser && !isSubscriptionEffective) return 'free';
        return null;
    }, [
        isLoading,
        hasPhone,
        routeSuppressed,
        isCampaignUser,
        isActive,
        isLastDayOfTrial,
        isSubscriptionEffective,
    ]);

    // Abre o modal (ou retoma minimizado) respeitando o cronômetro já iniciado.
    useEffect(() => {
        if (!phase) {
            setView('hidden');
            return;
        }

        const now = Date.now();
        const deadline = readFlashDeadline(phase);

        // Cronômetro expirado: não mostra mais essa fase.
        if (deadline !== null && now >= deadline) {
            setView('hidden');
            return;
        }

        // Cronômetro em andamento (já foi exibido antes): retoma como selo minimizado.
        if (deadline !== null && now < deadline) {
            setView('pill');
            return;
        }

        // Primeira vez: agenda a abertura do modal e inicia o cronômetro ao abrir.
        const initialDelay = phase === 'trialLastDay' ? INITIAL_DELAY_LAST_DAY_MS : INITIAL_DELAY_MS;
        const timer = window.setTimeout(() => {
            writeFlashDeadline(phase, Date.now() + FLASH_WINDOW_MS);
            setView('modal');
        }, initialDelay);
        return () => window.clearTimeout(timer);
    }, [phase]);

    // Tick do cronômetro enquanto visível; some sozinho ao zerar.
    useEffect(() => {
        if (view === 'hidden' || !phase) return;
        const deadline = readFlashDeadline(phase);
        if (deadline === null) return;

        const tick = () => {
            const rem = deadline - Date.now();
            if (rem <= 0) {
                setRemainingMs(0);
                setView('hidden');
            } else {
                setRemainingMs(rem);
            }
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [view, phase]);

    const minimize = () => setView('pill');
    const expand = () => setView('modal');

    const handleClose = (_: object, reason: string) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            minimize();
        }
    };

    if (!phase || view === 'hidden') return null;

    const isTrialPhase = phase === 'trial' || phase === 'trialLastDay';
    const countdownLabel = formatCountdown(remainingMs ?? FLASH_WINDOW_MS);

    return (
        <>
            {view === 'pill' && (
                <Box
                    role="button"
                    tabIndex={0}
                    onClick={expand}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') expand();
                    }}
                    aria-label="Reabrir oferta relâmpago"
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 84, sm: 24 },
                        left: { xs: 12, sm: 24 },
                        zIndex: (t) => t.zIndex.snackbar,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        pl: 1.5,
                        pr: 2,
                        py: 1,
                        borderRadius: 999,
                        cursor: 'pointer',
                        color: 'error.contrastText',
                        bgcolor: 'error.main',
                        boxShadow: 6,
                        userSelect: 'none',
                        transition: 'filter 120ms ease, transform 120ms ease',
                        '&:hover': { filter: 'brightness(1.06)', transform: 'translateY(-1px)' },
                    }}
                >
                    <BoltIcon sx={{ fontSize: 20 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
                            Oferta relâmpago
                        </Typography>
                        <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            {countdownLabel}
                        </Typography>
                    </Box>
                </Box>
            )}

            <Dialog
                open={view === 'modal'}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        maxWidth: 420,
                        mx: 2,
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: (t) => t.shadows[12],
                    },
                }}
            >
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                    <IconButton
                        size="small"
                        onClick={minimize}
                        sx={{ color: 'text.secondary' }}
                        title="Minimizar (o cronômetro continua correndo)"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.5,
                            mb: 1.5,
                            borderRadius: 999,
                            bgcolor: 'error.main',
                            color: 'error.contrastText',
                            fontWeight: 700,
                        }}
                    >
                        <BoltIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                            OFERTA RELÂMPAGO
                        </Typography>
                    </Box>

                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {displayName}essa oferta expira em
                    </Typography>

                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{ fontVariantNumeric: 'tabular-nums', color: 'error.main', mb: 1.5 }}
                    >
                        {countdownLabel}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {isTrialPhase
                            ? 'Desbloqueie o chat com IA treinada da Dome para acelerar sua produção de conteúdo: roteiros, ideias, legendas e ganchos virais em segundos.'
                            : 'Desbloqueie todas as funções da Dome e tenha acesso ao chat com IA treinada para criar seus conteúdos muito mais rápido: roteiros, ideias, legendas e ganchos virais em segundos.'}
                    </Typography>

                    <Box
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 2,
                            px: 2,
                            borderRadius: 2,
                            mb: 2,
                        }}
                    >
                        <Typography variant="h4" fontWeight="bold" component="span">
                            R$ 80,00
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            por 1 ano de acesso completo
                        </Typography>
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', opacity: 0.85 }}>
                            De R$ 397,90
                        </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Inclui acesso a IA treinada pela Nat e Luigi e oportunidades com marcas. Quando a oferta terminar, este preço deixará de estar disponível.

                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        href={KIWIFY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            py: 1.5,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                            },
                        }}
                    >
                        Garantir meu desconto
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    );
}

'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Button,
    IconButton,
    Box,
} from '@mui/material';
import { Close as CloseIcon, LocalOffer as OfferIcon } from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';

const CAMPAIGN_PRODUCT_NAME = 'Dome - Campanha 14 dias grátis';
const KIWIFY_URL = 'https://pay.kiwify.com.br/tuxuXlK';
const DELAY_SECONDS = 10;

export function CampaignPromoModal() {
    const { account, subscription, isLoading, refreshAccount, updateAccount } = useAccount();
    const firstName = account?.first_name?.trim() || '';
    const displayName = firstName ? `${firstName}, temos ` : 'Temos ';
    const [open, setOpen] = useState(false);
    const [dismissing, setDismissing] = useState(false);

    const isCampaignUser = subscription?.product_name === CAMPAIGN_PRODUCT_NAME;
    const isActive = subscription?.status === 'active';
    const alreadyDismissed = Boolean(account?.campaign_promo_dismissed_at);

    const shouldShow = !isLoading && isCampaignUser && isActive && !alreadyDismissed;

    React.useEffect(() => {
        if (!shouldShow) return;
        const timer = window.setTimeout(() => setOpen(true), DELAY_SECONDS * 1000);
        return () => window.clearTimeout(timer);
    }, [shouldShow]);

    const handleDismiss = async () => {
        if (dismissing) return;
        setDismissing(true);
        try {
            const ok = await updateAccount({
                campaign_promo_dismissed_at: new Date().toISOString(),
            });
            if (ok) {
                setOpen(false);
                await refreshAccount();
            }
        } finally {
            setDismissing(false);
        }
    };

    const handleClose = (_: object, reason: string) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            handleDismiss();
        }
    };

    if (!shouldShow) return null;

    return (
        <Dialog
            open={open}
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
                    onClick={handleDismiss}
                    disabled={dismissing}
                    sx={{ color: 'text.secondary' }}
                    title="Fechar (esta oferta não aparecerá novamente)"
                >
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
                <OfferIcon
                    sx={{
                        fontSize: 48,
                        color: 'primary.main',
                        mb: 1,
                    }}
                />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {displayName}uma oferta imperdível só para você
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ative seu acesso a todas as funcionalidades da Dome imediatamente por um preço único e imperdível.
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
                        R$ 89,90
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        por 6 meses de acesso
                    </Typography>
                    <Typography variant="caption" sx={{ textDecoration: 'line-through', opacity: 0.85 }}>
                        De R$ 587,40
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Esta oferta aparece só uma vez. Se fechar, você não terá mais acesso a este preço.
                </Typography>
                <Typography
                    variant="caption"
                    sx={{ display: 'block', mb: 2, color: 'warning.dark', fontWeight: 600 }}
                >
                    Se não ativar agora, depois do seu período gratuito de 14 dias o valor desse mesmo plano passa a ser R$ 587,90.
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
    );
}

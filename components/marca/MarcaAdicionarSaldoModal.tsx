'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    TextField,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    Alert,
    IconButton,
    alpha,
    useTheme,
    Radio,
    RadioGroup,
    FormControlLabel,
    Paper,
} from '@mui/material';
import {
    Close as CloseIcon,
    InfoOutlined as InfoIcon,
    Percent as PercentIcon,
    ChevronRight as ChevronRightIcon,
    Redeem as RedeemIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';
import {
    WALLET_TOP_UP_COUPONS,
    getWalletTopUpCouponById,
    MIN_WALLET_RECHARGE_CENTS,
    type WalletTopUpCoupon,
} from '@/lib/wallet-coupons';

const PRESETS = [100_000, 250_000, 500_000, 1_000_000] as const;
const PRESET_LABELS: Record<number, string> = {
    100_000: 'R$ 1.000',
    250_000: 'R$ 2,5k',
    500_000: 'R$ 5k',
    1_000_000: 'R$ 10k',
};
const PLATFORM_FEE = 0.15;

function formatBrl(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function couponMeetsMinDeposit(c: WalletTopUpCoupon, amountCents: number): boolean {
    return amountCents >= c.minDepositCents;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

export function MarcaAdicionarSaldoModal({ open, onClose }: Props) {
    const theme = useTheme();
    const { account } = useAccount();
    const [method, setMethod] = useState<'card' | 'boleto' | 'pix'>('card');
    const [amountCents, setAmountCents] = useState(1_000_000);
    const [payLoading, setPayLoading] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const [couponsOpen, setCouponsOpen] = useState(false);
    const [selectedCouponId, setSelectedCouponId] = useState<string>('');

    useEffect(() => {
        if (!open) {
            setCouponsOpen(false);
            setSelectedCouponId('');
            setPayError(null);
        }
    }, [open]);

    const selectedCoupon = selectedCouponId ? getWalletTopUpCouponById(selectedCouponId) : undefined;

    useEffect(() => {
        if (!selectedCouponId) return;
        const c = getWalletTopUpCouponById(selectedCouponId);
        if (c && !couponMeetsMinDeposit(c, amountCents)) {
            setSelectedCouponId('');
        }
    }, [amountCents, selectedCouponId]);

    const summary = useMemo(() => {
        const fee = Math.round(amountCents * PLATFORM_FEE);
        const baseAfterFee = amountCents - fee;
        const eligible =
            selectedCoupon != null && couponMeetsMinDeposit(selectedCoupon, amountCents);
        const bonus = eligible ? selectedCoupon.bonusCents : 0;
        return { fee, baseAfterFee, bonus, credited: baseAfterFee + bonus, eligible };
    }, [amountCents, selectedCoupon]);

    const eligibleCouponsCount = useMemo(
        () => WALLET_TOP_UP_COUPONS.filter((c) => couponMeetsMinDeposit(c, amountCents)).length,
        [amountCents],
    );

    /** Melhor bônus entre cupons que já cumprem o mínimo com o valor atual. */
    const bestEligibleCoupon = useMemo(() => {
        const ok = WALLET_TOP_UP_COUPONS.filter((c) => couponMeetsMinDeposit(c, amountCents));
        if (ok.length === 0) return null;
        return [...ok].sort((a, b) => b.bonusCents - a.bonusCents)[0];
    }, [amountCents]);

    function applyCouponChoice(id: string) {
        setSelectedCouponId(id);
        setCouponsOpen(false);
    }

    async function handleContinuePayment() {
        setPayError(null);
        if (amountCents < MIN_WALLET_RECHARGE_CENTS) {
            setPayError('O valor mínimo da recarga é R$ 500,00.');
            return;
        }
        setPayLoading(true);
        try {
            const res = await fetch('/api/marca/wallet/checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountCents,
                    paymentMethod: method,
                    ...(selectedCouponId ? { couponId: selectedCouponId } : {}),
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
            if (!res.ok) {
                setPayError(data.error || 'Não foi possível iniciar o pagamento.');
                return;
            }
            if (data.url) {
                window.location.assign(data.url);
                return;
            }
            setPayError('Resposta inválida do servidor.');
        } catch {
            setPayError('Erro de rede. Tente novamente.');
        } finally {
            setPayLoading(false);
        }
    }

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} alignItems="stretch">
                        <Box sx={{ flex: 1, p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>
                                    Adicionar saldo
                                </Typography>
                                <IconButton onClick={onClose} aria-label="Fechar" size="small">
                                    <CloseIcon />
                                </IconButton>
                            </Stack>

                            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                                Escolha a recarga e finalize o pagamento para adicionar saldo na carteira.
                            </Alert>
                            {payError && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPayError(null)}>
                                    {payError}
                                </Alert>
                            )}

                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                Como você quer pagar
                            </Typography>
                            <ToggleButtonGroup
                                exclusive
                                fullWidth
                                value={method}
                                onChange={(_, v) => v && setMethod(v)}
                                sx={{ mb: 3 }}
                            >
                                <ToggleButton value="card" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    Cartão (recomendado)
                                </ToggleButton>
                                <ToggleButton value="boleto" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    Boleto
                                </ToggleButton>
                                <ToggleButton value="pix" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    PIX
                                </ToggleButton>
                            </ToggleButtonGroup>

                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                Valor da recarga
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                inputProps={{ min: MIN_WALLET_RECHARGE_CENTS / 100, step: 1 }}
                                value={amountCents / 100}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    if (Number.isNaN(v)) return;
                                    const cents = Math.round(v * 100);
                                    setAmountCents(
                                        Math.min(Math.max(cents, MIN_WALLET_RECHARGE_CENTS), 999_999_999),
                                    );
                                }}
                                sx={{ mb: 1.5 }}
                                size="small"
                                label="Valor (R$)"
                                helperText="Mínimo R$ 500,00 por recarga"
                            />
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                {PRESETS.map((c) => (
                                    <Button
                                        key={c}
                                        size="small"
                                        variant={amountCents === c ? 'contained' : 'outlined'}
                                        onClick={() => setAmountCents(c)}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                        {PRESET_LABELS[c] ?? formatBrl(c)}
                                    </Button>
                                ))}
                            </Stack>

                            {/* <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<RedeemIcon />}
                                onClick={() => setCouponsOpen(true)}
                                sx={{ textTransform: 'none', fontWeight: 700, mb: 1.5, borderRadius: 2, py: 1 }}
                            >
                                Resgatar cupons 1
                            </Button> */}

                            <Paper
                                variant="outlined"
                                onClick={() => setCouponsOpen(true)}
                                sx={{
                                    p: 1.75,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    mb: 2,
                                    borderColor: alpha(theme.palette.primary.main, 0.35),
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        color: 'primary.main',
                                    }}
                                >
                                    <PercentIcon fontSize="small" />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700}>
                                        {selectedCoupon && summary.eligible
                                            ? `${selectedCoupon.title} aplicado (+${formatBrl(selectedCoupon.bonusCents)})`
                                            : bestEligibleCoupon
                                              ? `Bônus de ${formatBrl(bestEligibleCoupon.bonusCents)} disponível`
                                              : 'Cupons de bônus'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {eligibleCouponsCount === 0
                                            ? `Nenhum cupom disponível para ${formatBrl(amountCents)} — aumente o valor da recarga`
                                            : `${eligibleCouponsCount} de ${WALLET_TOP_UP_COUPONS.length} cupons elegíveis — toque para escolher`}
                                    </Typography>
                                </Box>
                                <ChevronRightIcon color="action" />
                            </Paper>

                            <Typography variant="caption" color="text.secondary">
                                Saldo atual na carteira:{' '}
                                <strong>{formatBrl(account?.wallet_balance_cents ?? 0)}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                                Você será redirecionado ao Stripe Checkout para pagar com segurança.
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                width: { xs: '100%', md: 280 },
                                flexShrink: 0,
                                bgcolor: alpha(theme.palette.primary.main, 0.06),
                                p: 3,
                                borderLeft: { md: 1 },
                                borderTop: { xs: 1, md: 0 },
                                borderColor: 'divider',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography
                                variant="overline"
                                fontWeight={700}
                                letterSpacing={2}
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Resumo
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Você pagará: <strong>{formatBrl(amountCents)}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Taxa de plataforma ({PLATFORM_FEE * 100}%): {formatBrl(summary.fee)}
                            </Typography>
                            {summary.bonus > 0 ? (
                                <Typography variant="body2" color="success.main" fontWeight={600} sx={{ mb: 1 }}>
                                    Bônus cupom: +{formatBrl(summary.bonus)}
                                </Typography>
                            ) : null}
                            <Typography variant="body1" fontWeight={700} sx={{ mb: 3 }}>
                                Creditado na carteira: {formatBrl(summary.credited)}
                            </Typography>
                            <Box sx={{ flex: 1 }} />
                            <Button
                                fullWidth
                                variant="contained"
                                disabled={payLoading || amountCents < MIN_WALLET_RECHARGE_CENTS}
                                onClick={() => void handleContinuePayment()}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    py: 1.25,
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                                }}
                            >
                                {payLoading ? 'Abrindo pagamento…' : 'Continuar para pagamento'}
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                Pagamento processado pela Stripe.
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>

            <Dialog
                open={couponsOpen}
                onClose={() => setCouponsOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        py: 2,
                        pr: 1,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <PercentIcon color="primary" />
                        <Typography component="span" variant="h6" fontWeight={800}>
                            Cupons ({WALLET_TOP_UP_COUPONS.length})
                        </Typography>
                    </Stack>
                    <IconButton aria-label="Fechar" onClick={() => setCouponsOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Só é possível selecionar cupons cujo depósito mínimo é atendido pelo valor da recarga atual (
                        {formatBrl(amountCents)}).
                    </Typography>
                    <RadioGroup value={selectedCouponId} onChange={(_, v) => applyCouponChoice(v)}>
                        <FormControlLabel
                            value=""
                            control={<Radio />}
                            sx={{ alignItems: 'flex-start', mb: 1, ml: 0 }}
                            label={
                                <Box sx={{ pt: 0.5 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Sem cupom
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Apenas o crédito após taxa da plataforma
                                    </Typography>
                                </Box>
                            }
                        />
                        {WALLET_TOP_UP_COUPONS.map((c: WalletTopUpCoupon) => {
                            const available = couponMeetsMinDeposit(c, amountCents);
                            return (
                                <FormControlLabel
                                    key={c.id}
                                    value={c.id}
                                    disabled={!available}
                                    control={<Radio disabled={!available} />}
                                    sx={{
                                        alignItems: 'flex-start',
                                        mb: 1,
                                        ml: 0,
                                        p: 1.5,
                                        mx: -1.5,
                                        borderRadius: 2,
                                        ...(available
                                            ? { '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.06) } }
                                            : { opacity: 0.55 }),
                                    }}
                                    label={
                                        <Stack
                                            direction="row"
                                            alignItems="flex-start"
                                            justifyContent="space-between"
                                            spacing={2}
                                            sx={{ width: '100%', pt: 0.25 }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {c.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Depósito mínimo: {formatBrl(c.minDepositCents)}
                                                </Typography>
                                                {!available ? (
                                                    <Typography variant="caption" color="warning.main" display="block">
                                                        Indisponível — aumente o valor da recarga
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                fontWeight={800}
                                                color={available ? 'success.main' : 'text.disabled'}
                                                sx={{ flexShrink: 0 }}
                                            >
                                                +{formatBrl(c.bonusCents)}
                                            </Typography>
                                        </Stack>
                                    }
                                />
                            );
                        })}
                    </RadioGroup>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCouponsOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

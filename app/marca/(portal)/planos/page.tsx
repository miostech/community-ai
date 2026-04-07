'use client';

import React from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    Chip,
    alpha,
    useTheme,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    WorkspacePremium as PremiumIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
    MARCA_PLAN_MONTHLY_BRL,
    MARCA_PLAN_YEARLY_BRL,
    MARCA_PLAN_YEARLY_DISCOUNT_PERCENT,
    MARCA_PLAN_YEARLY_IF_PAID_MONTHLY_BRL,
    MARCA_PLAN_CHECKOUT_URL_MONTHLY_DEFAULT,
    MARCA_PLAN_CHECKOUT_URL_YEARLY_DEFAULT,
} from '@/lib/marca-plans';

function fmtMoney(n: number) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const FEATURES = [
    'Acesso a Comunidades do portal da marca',
    'Vitrine e busca de Criadores alinhados à sua campanha',
    'Tracking de campanhas e indicadores em um só lugar',
    'Campanhas, carteira e mensagens no ecossistema Dome (marca)',
] as const;

export default function MarcaPlanosPage() {
    const theme = useTheme();
    const monthlyCheckout =
        process.env.NEXT_PUBLIC_MARCA_PLAN_CHECKOUT_MONTHLY?.trim() || MARCA_PLAN_CHECKOUT_URL_MONTHLY_DEFAULT;
    const yearlyCheckout =
        process.env.NEXT_PUBLIC_MARCA_PLAN_CHECKOUT_YEARLY?.trim() || MARCA_PLAN_CHECKOUT_URL_YEARLY_DEFAULT;

    const yearlySaveBrl = MARCA_PLAN_YEARLY_IF_PAID_MONTHLY_BRL - MARCA_PLAN_YEARLY_BRL;

    return (
        <Box sx={{ maxWidth: 960, mx: 'auto' }}>
            <Button
                component={Link}
                href="/marca/inicio"
                startIcon={<ArrowBackIcon />}
                sx={{ textTransform: 'none', fontWeight: 600, mb: 2 }}
            >
                Voltar ao início
            </Button>

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                    }}
                >
                    <PremiumIcon />
                </Box>
                <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                        Portal da marca
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        Planos para marcas
                    </Typography>
                </Box>
            </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720, lineHeight: 1.65 }}>
                Estes planos são <strong>exclusivos para marcas</strong> e liberam Comunidades, Criadores e Tracking no
                portal.
            </Typography>

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2.5}
                alignItems="stretch"
                sx={{ mb: 4 }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        p: 3,
                        borderRadius: 3,
                        border: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 0.5 }}>
                        Mensal
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
                        {fmtMoney(MARCA_PLAN_MONTHLY_BRL)}
                        <Typography component="span" variant="body1" color="text.secondary" fontWeight={600}>
                            {' '}
                            /mês
                        </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Cancele quando quiser. Cobrança mensal.
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    {monthlyCheckout ? (
                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            component="a"
                            href={monthlyCheckout}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1.25 }}
                        >
                            Assinar mensal
                        </Button>
                    ) : (
                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            disabled
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1.25 }}
                        >
                            Link de pagamento em configuração
                        </Button>
                    )}
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        p: 3,
                        borderRadius: 3,
                        border: 2,
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                            Anual
                        </Typography>
                        <Chip
                            label={`${MARCA_PLAN_YEARLY_DISCOUNT_PERCENT}% OFF`}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 800 }}
                        />
                    </Stack>
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
                        {fmtMoney(MARCA_PLAN_YEARLY_BRL)}
                        <Typography component="span" variant="body1" color="text.secondary" fontWeight={600}>
                            {' '}
                            /ano
                        </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Em vez de {fmtMoney(MARCA_PLAN_YEARLY_IF_PAID_MONTHLY_BRL)} pagando mês a mês.
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight={700} sx={{ mb: 2 }}>
                        Economia de {fmtMoney(yearlySaveBrl)} no ano
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    {yearlyCheckout ? (
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            component="a"
                            href={yearlyCheckout}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                py: 1.25,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                            }}
                        >
                            Assinar anual
                        </Button>
                    ) : (
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                py: 1.25,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                            }}
                        >
                            Link de pagamento em configuração
                        </Button>
                    )}
                </Paper>
            </Stack>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                    O que está incluído
                </Typography>
                <List dense disablePadding>
                    {FEATURES.map((text) => (
                        <ListItem key={text} disableGutters sx={{ alignItems: 'flex-start', py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36, color: 'primary.main', mt: 0.25 }}>
                                <CheckIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                        </ListItem>
                    ))}
                </List>
            </Paper>

        </Box>
    );
}

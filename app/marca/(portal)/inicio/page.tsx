'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    Breadcrumbs,
    LinearProgress,
    Grid,
    alpha,
    useTheme,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    ChevronRight as ChevronRightIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';
import { isBrandProfileComplete } from '@/lib/marca-brand-profile';
import { MarcaNovaCampanhaModal } from '@/components/marca/MarcaNovaCampanhaModal';

interface CampaignRow {
    _id: string;
    title: string;
    status: string;
    brand_name: string;
    brand_logo?: string;
    applications_count?: number;
}

const STATUS_LABEL: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativa',
    paused: 'Pausada',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

function formatBrl(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MarcaInicioPage() {
    const theme = useTheme();
    const router = useRouter();
    const { account, refreshAccount } = useAccount();
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [dashScope, setDashScope] = useState('all');
    const [dashPeriod, setDashPeriod] = useState('campaigns');
    const [novaOpen, setNovaOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/campaigns?brand=true&limit=12');
            const data = await res.json();
            if (res.ok) setCampaigns(data.campaigns || []);
        } catch {
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('wallet') === 'success') {
            void refreshAccount();
            window.history.replaceState({}, '', '/marca/inicio');
        }
    }, [refreshAccount]);

    const profileOk = account ? isBrandProfileComplete(account) : false;
    const hasCampaign = campaigns.length > 0;
    const hasCommunity = false;
    const exploredCreators = false;
    const onboardingDone = (hasCampaign ? 1 : 0) + (hasCommunity ? 1 : 0) + (exploredCreators ? 1 : 0);
    const onboardingTotal = 3;

    const balance = account?.wallet_balance_cents ?? 0;

    const recentCampaigns = useMemo(() => campaigns.slice(0, 4), [campaigns]);

    function handleNovaCampanha() {
        if (profileOk) router.push('/marca/campanhas/nova');
        else setNovaOpen(true);
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Breadcrumbs sx={{ mb: 2, '& a': { color: 'text.secondary', textDecoration: 'none' } }}>
                <Link href="/marca/inicio">Dashboard</Link>
                <Typography color="text.primary" fontWeight={600}>
                    Início
                </Typography>
            </Breadcrumbs>

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider', mb: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
                    <Typography variant="h6" fontWeight={800}>
                        Comece por aqui
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {onboardingDone}/{onboardingTotal}
                    </Typography>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={(onboardingDone / onboardingTotal) * 100}
                    sx={{ height: 6, borderRadius: 3, mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.12) }}
                />
                <Grid container spacing={2}>
                    {[
                        {
                            title: 'Crie sua primeira campanha de creators.',
                            done: hasCampaign,
                            onStart: handleNovaCampanha,
                        },
                        {
                            title: 'Crie sua primeira comunidade de creators.',
                            done: hasCommunity,
                            onStart: () => router.push('/marca/comunidades'),
                        },
                        {
                            title: 'Explore e se conecte com criadores.',
                            done: exploredCreators,
                            onStart: () => router.push('/marca/criadores'),
                        },
                    ].map((card, i) => (
                        <Grid size={{ xs: 12, md: 4 }} key={i}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2,
                                    opacity: card.done ? 0.85 : 1,
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} sx={{ flex: 1, mb: 2 }}>
                                    {card.title}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        size="small"
                                        variant={card.done ? 'outlined' : 'contained'}
                                        onClick={card.onStart}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                    >
                                        {card.done ? 'Concluído' : 'Começar'}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 2 }}
            >
                <Typography variant="h6" fontWeight={800}>
                    Dashboard
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Visão</InputLabel>
                        <Select label="Visão" value={dashScope} onChange={(e) => setDashScope(e.target.value)}>
                            <MenuItem value="all">Tudo</MenuItem>
                            <MenuItem value="campaigns">Campanhas</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Campanhas</InputLabel>
                        <Select label="Campanhas" value={dashPeriod} onChange={(e) => setDashPeriod(e.target.value)}>
                            <MenuItem value="campaigns">Campanhas</MenuItem>
                            <MenuItem value="active">Ativas</MenuItem>
                            <MenuItem value="draft">Rascunho</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNovaCampanha}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            whiteSpace: 'nowrap',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        }}
                    >
                        Nova campanha
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Valor investido', value: formatBrl(0) },
                            { label: 'Total de views', value: '0', link: true },
                            { label: 'Saldo restante', value: formatBrl(balance) },
                            { label: 'Conteúdos aprovados', value: '0' },
                            { label: 'CPM', value: '—' },
                            { label: 'Custo médio/conteúdo', value: '—' },
                        ].map((m) => (
                            <Grid size={{ xs: 6, sm: 4 }} key={m.label}>
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                        {m.label}
                                    </Typography>
                                    <Typography variant="h6" fontWeight={800}>
                                        {m.value}
                                    </Typography>
                                    {m.link && (
                                        <Typography variant="caption" color="primary" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>
                                            Ver em detalhes
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: 2,
                            border: 1,
                            borderColor: 'divider',
                            height: '100%',
                            minHeight: 200,
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                            Aguardando aprovação
                        </Typography>
                        <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 4 }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'action.disabled' }} />
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                Nenhum vídeo aguardando aprovação.
                            </Typography>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Minhas campanhas
            </Typography>

            {loading ? (
                <Typography color="text.secondary">Carregando…</Typography>
            ) : recentCampaigns.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <TrendingIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.4, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Você ainda não tem campanhas.
                    </Typography>
                    <Button variant="contained" onClick={handleNovaCampanha} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Nova campanha
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {recentCampaigns.map((c) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c._id}>
                            <Paper
                                component={Link}
                                href={`/marca/campanhas/${c._id}`}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: 'divider',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    display: 'block',
                                    height: '100%',
                                    transition: 'box-shadow 0.15s',
                                    '&:hover': { boxShadow: theme.shadows[3], borderColor: alpha(theme.palette.primary.main, 0.4) },
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            color: 'primary.main',
                                        }}
                                    >
                                        {c.title.charAt(0).toUpperCase()}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        fontWeight={700}
                                        sx={{
                                            bgcolor: alpha(theme.palette.grey[500], 0.15),
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {STATUS_LABEL[c.status] || c.status}
                                    </Typography>
                                </Stack>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                                    {c.title}
                                </Typography>
                                <Stack spacing={0.5} sx={{ mb: 2 }}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">
                                            Budget
                                        </Typography>
                                        <Typography variant="caption" fontWeight={700}>
                                            {formatBrl(0)}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">
                                            Investimento
                                        </Typography>
                                        <Typography variant="caption" fontWeight={700}>
                                            {formatBrl(0)}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">
                                            CPV
                                        </Typography>
                                        <Typography variant="caption" fontWeight={700}>
                                            {formatBrl(0)}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                <Button
                                    size="small"
                                    endIcon={<ChevronRightIcon />}
                                    sx={{ p: 0, minWidth: 0, textTransform: 'none', fontWeight: 700 }}
                                >
                                    Acessar
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            <MarcaNovaCampanhaModal open={novaOpen} onClose={() => setNovaOpen(false)} />
        </Box>
    );
}

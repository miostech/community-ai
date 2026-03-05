'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Grid,
    Chip,
    Button,
    CircularProgress,
    alpha,
    useTheme,
    Divider,
    Avatar,
} from '@mui/material';
import {
    Campaign as CampaignIcon,
    Add as AddIcon,
    PendingActions as PendingIcon,
    CheckCircle as CheckCircleIcon,
    Pause as PauseIcon,
    Edit as DraftIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface CampaignSummary {
    _id: string;
    title: string;
    brand_name: string;
    brand_logo?: string;
    status: string;
    applications_count: number;
    slots: number;
    slots_filled: number;
    created_at: string;
}

interface Stats {
    total: number;
    draft: number;
    active: number;
    paused: number;
    completed: number;
    cancelled: number;
    pendingApplications: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
    draft: { label: 'Rascunho', color: 'default' },
    active: { label: 'Ativa', color: 'success' },
    paused: { label: 'Pausada', color: 'warning' },
    completed: { label: 'Concluída', color: 'info' },
    cancelled: { label: 'Cancelada', color: 'error' },
};

export default function AdminOverviewPage() {
    const theme = useTheme();
    const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/campaigns?admin=true&limit=100');
                const data = await res.json();
                const all: CampaignSummary[] = data.campaigns || [];

                const computed: Stats = {
                    total: all.length,
                    draft: all.filter((c) => c.status === 'draft').length,
                    active: all.filter((c) => c.status === 'active').length,
                    paused: all.filter((c) => c.status === 'paused').length,
                    completed: all.filter((c) => c.status === 'completed').length,
                    cancelled: all.filter((c) => c.status === 'cancelled').length,
                    pendingApplications: 0,
                };

                // Buscar contagem de candidaturas pendentes das campanhas ativas
                const activeCampaigns = all.filter((c) => c.status === 'active' || c.status === 'paused');
                const pendingCounts = await Promise.all(
                    activeCampaigns.map(async (c) => {
                        const r = await fetch(`/api/campaigns/${c._id}/applications`);
                        const d = await r.json();
                        return (d.applications || []).filter((a: { status: string }) => a.status === 'pending').length;
                    })
                );
                computed.pendingApplications = pendingCounts.reduce((a, b) => a + b, 0);

                setStats(computed);
                setCampaigns(all.slice(0, 5));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const statCards = stats
        ? [
              { label: 'Total de campanhas', value: stats.total, icon: <CampaignIcon />, color: theme.palette.primary.main },
              { label: 'Ativas', value: stats.active, icon: <CheckCircleIcon />, color: theme.palette.success.main },
              { label: 'Rascunhos', value: stats.draft, icon: <DraftIcon />, color: theme.palette.text.secondary },
              { label: 'Pausadas', value: stats.paused, icon: <PauseIcon />, color: theme.palette.warning.main },
              { label: 'Candidaturas pendentes', value: stats.pendingApplications, icon: <PendingIcon />, color: '#ec4899' },
          ]
        : [];

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 2, sm: 4 } }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                        Painel de Moderação
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Visão geral das campanhas e candidaturas
                    </Typography>
                </Box>
                <Button
                    component={Link}
                    href="/dashboard/admin/campanhas/nova"
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                >
                    Nova campanha
                </Button>
            </Stack>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                        {statCards.map((card) => (
                            <Grid size={{ xs: 6, sm: 4, md: 'auto' }} key={card.label} sx={{ flex: { md: 1 } }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 2, sm: 2.5 },
                                        borderRadius: { xs: 2.5, sm: 3 },
                                        border: 1,
                                        borderColor: 'divider',
                                        height: '100%',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(card.color, 0.12),
                                            color: card.color,
                                            mb: 1.5,
                                        }}
                                    >
                                        {React.cloneElement(card.icon, { sx: { fontSize: 20 } })}
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2rem' }, lineHeight: 1 }}>
                                        {card.value}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                        {card.label}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    <Paper
                        elevation={0}
                        sx={{ borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', overflow: 'hidden' }}
                    >
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ px: { xs: 2, sm: 3 }, py: 2, borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                Campanhas recentes
                            </Typography>
                            <Button
                                component={Link}
                                href="/dashboard/admin/campanhas"
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                            >
                                Ver todas
                            </Button>
                        </Stack>

                        {campaigns.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Nenhuma campanha criada ainda.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack divider={<Divider />}>
                                {campaigns.map((campaign) => {
                                    const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                                    return (
                                        <Stack
                                            key={campaign._id}
                                            direction="row"
                                            alignItems="center"
                                            spacing={2}
                                            sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}
                                        >
                                            <Avatar
                                                src={campaign.brand_logo}
                                                sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 16, fontWeight: 700 }}
                                            >
                                                {campaign.brand_name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                >
                                                    {campaign.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {campaign.brand_name} · {campaign.applications_count} candidatura{campaign.applications_count !== 1 ? 's' : ''}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={cfg.label}
                                                color={cfg.color}
                                                size="small"
                                                sx={{ fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}
                                            />
                                            <Button
                                                component={Link}
                                                href={`/dashboard/admin/campanhas/${campaign._id}`}
                                                size="small"
                                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', flexShrink: 0 }}
                                            >
                                                Gerenciar
                                            </Button>
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        )}
                    </Paper>
                </>
            )}
        </Box>
    );
}

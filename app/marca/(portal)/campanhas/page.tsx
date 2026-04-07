'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Stack,
    Breadcrumbs,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Paper,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Campaign as CampaignIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';
import { isBrandProfileComplete } from '@/lib/marca-brand-profile';
import { MarcaNovaCampanhaModal } from '@/components/marca/MarcaNovaCampanhaModal';

interface CampaignRow {
    _id: string;
    title: string;
    status: string;
    brand_name: string;
    applications_count?: number;
}

const STATUS_LABEL: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativa',
    paused: 'Pausada',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

function statusChipColor(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
    switch (status) {
        case 'active':
            return 'success';
        case 'draft':
            return 'primary';
        case 'paused':
            return 'warning';
        case 'completed':
            return 'default';
        case 'cancelled':
            return 'error';
        default:
            return 'default';
    }
}

export default function MarcaCampanhasPage() {
    const theme = useTheme();
    const router = useRouter();
    const { account, refreshAccount } = useAccount();
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [novaOpen, setNovaOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            if (showArchived) {
                const [r1, r2] = await Promise.all([
                    fetch('/api/campaigns?brand=true&status=completed&limit=50'),
                    fetch('/api/campaigns?brand=true&status=cancelled&limit=50'),
                ]);
                const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
                const a = r1.ok && Array.isArray(d1.campaigns) ? d1.campaigns : [];
                const b = r2.ok && Array.isArray(d2.campaigns) ? d2.campaigns : [];
                setCampaigns([...a, ...b]);
            } else {
                const q = new URLSearchParams({ brand: 'true', limit: '80' });
                if (status !== 'all') q.set('status', status);
                const res = await fetch(`/api/campaigns?${q.toString()}`);
                const data = await res.json();
                if (res.ok) setCampaigns(data.campaigns || []);
                else setCampaigns([]);
            }
        } catch {
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    }, [status, showArchived]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('wallet') === 'success') {
            void refreshAccount();
            window.history.replaceState({}, '', '/marca/campanhas');
        }
    }, [refreshAccount]);

    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return campaigns;
        return campaigns.filter((c) => c.title.toLowerCase().includes(t) || c.brand_name.toLowerCase().includes(t));
    }, [campaigns, search]);

    const profileOk = account ? isBrandProfileComplete(account) : false;

    function handleNovaCampanha() {
        if (profileOk) router.push('/marca/campanhas/nova');
        else setNovaOpen(true);
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Breadcrumbs sx={{ mb: 2, '& a': { color: 'text.secondary', textDecoration: 'none' } }}>
                <Link href="/marca/inicio">Dashboard</Link>
                <Typography color="text.primary" fontWeight={600}>
                    Campanhas
                </Typography>
            </Breadcrumbs>

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', md: 'flex-start' }}
                spacing={2}
                sx={{ mb: 2 }}
            >
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 45%, #ec4899 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                    }}
                >
                    Campanhas
                </Typography>
            </Stack>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <TextField
                    size="small"
                    placeholder="Pesquisar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1, maxWidth: { sm: 360 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <FormControl size="small" sx={{ minWidth: 180 }} disabled={showArchived}>
                        <InputLabel>Selecione um status</InputLabel>
                        <Select
                            label="Selecione um status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="draft">Rascunho</MenuItem>
                            <MenuItem value="active">Ativa</MenuItem>
                            <MenuItem value="paused">Pausada</MenuItem>
                            <MenuItem value="completed">Concluída</MenuItem>
                            <MenuItem value="cancelled">Cancelada</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="text"
                        onClick={() => setShowArchived((v) => !v)}
                        sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                    >
                        {showArchived ? 'Ver ativas' : 'Ver arquivadas'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNovaCampanha}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            borderRadius: 2,
                            px: 2,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        }}
                    >
                        Nova campanha
                    </Button>
                </Stack>
            </Stack>

            <TableContainer
                component={Paper}
                elevation={0}
                sx={{ borderRadius: 2, border: 1, borderColor: 'divider', overflow: 'hidden' }}
            >
                <Table size="medium">
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.06) }}>
                            <TableCell sx={{ fontWeight: 700 }}>Campanha</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                                Visualizações
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                                Cliques
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                                Entregas
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                                Aprovadas
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                Ação
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <Typography color="text.secondary" sx={{ py: 3 }}>
                                        Carregando…
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <Stack alignItems="center" sx={{ py: 6 }}>
                                        <CampaignIcon sx={{ fontSize: 44, color: 'primary.main', opacity: 0.35, mb: 1 }} />
                                        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                                            Nenhuma campanha nesta visão
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Crie uma campanha ou ajuste filtros.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={handleNovaCampanha}
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                        >
                                            Nova campanha
                                        </Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((c) => (
                                <TableRow key={c._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                    <TableCell>
                                        <Typography fontWeight={700}>{c.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {c.brand_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={STATUS_LABEL[c.status] || c.status}
                                            size="small"
                                            color={statusChipColor(c.status)}
                                            variant={c.status === 'draft' ? 'filled' : 'outlined'}
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography color="text.secondary">—</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography color="text.secondary">—</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography color="text.secondary">—</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography color="text.secondary">—</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            component={Link}
                                            href={
                                                c.status === 'draft'
                                                    ? `/marca/campanhas/nova?continue=${c._id}`
                                                    : `/marca/campanhas/${c._id}`
                                            }
                                            size="small"
                                            endIcon={<ChevronRightIcon />}
                                            sx={{ textTransform: 'none', fontWeight: 700 }}
                                        >
                                            {c.status === 'draft' ? 'Continuar configuração' : 'Abrir'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <MarcaNovaCampanhaModal open={novaOpen} onClose={() => setNovaOpen(false)} />
        </Box>
    );
}

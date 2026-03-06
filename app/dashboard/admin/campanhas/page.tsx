'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Chip,
    Button,
    CircularProgress,
    alpha,
    useTheme,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Avatar,
    IconButton,
    Tooltip,
    Divider,
    Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Group as GroupIcon,
    PlayArrow as ActivateIcon,
    Pause as PauseIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';

interface Campaign {
    _id: string;
    title: string;
    brand_name: string;
    brand_logo?: string;
    brand_instagram?: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
    content_type: string;
    niches: string[];
    slots: number;
    slots_unlimited?: boolean;
    slots_filled: number;
    applications_count: number;
    created_at: string;
    application_deadline?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
    draft: { label: 'Rascunho', color: 'default' },
    active: { label: 'Ativa', color: 'success' },
    paused: { label: 'Pausada', color: 'warning' },
    completed: { label: 'Concluída', color: 'info' },
    cancelled: { label: 'Cancelada', color: 'error' },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
    ugc: 'UGC',
    reels: 'Reels',
    stories: 'Stories',
    tiktok: 'TikTok',
    post_feed: 'Post Feed',
    outro: 'Outro',
};

export default function AdminCampanhasPage() {
    const theme = useTheme();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterBrand, setFilterBrand] = useState('all');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    async function fetchCampaigns() {
        setLoading(true);
        try {
            const res = await fetch('/api/campaigns?admin=true&limit=100');
            const data = await res.json();
            setCampaigns(data.campaigns || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(campaignId: string, status: string) {
        setUpdatingId(campaignId);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setCampaigns((prev) =>
                    prev.map((c) => (c._id === campaignId ? { ...c, status: status as Campaign['status'] } : c))
                );
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    }

    const brands = useMemo(() => {
        const names = Array.from(new Set(campaigns.map((c) => c.brand_name))).sort();
        return names;
    }, [campaigns]);

    const filtered = useMemo(() => {
        return campaigns.filter((c) => {
            const matchSearch =
                !searchText ||
                c.title.toLowerCase().includes(searchText.toLowerCase()) ||
                c.brand_name.toLowerCase().includes(searchText.toLowerCase());
            const matchStatus = filterStatus === 'all' || c.status === filterStatus;
            const matchBrand = filterBrand === 'all' || c.brand_name === filterBrand;
            return matchSearch && matchStatus && matchBrand;
        });
    }, [campaigns, searchText, filterStatus, filterBrand]);

    // Group by brand
    const grouped = useMemo(() => {
        const map: Record<string, Campaign[]> = {};
        for (const c of filtered) {
            if (!map[c.brand_name]) map[c.brand_name] = [];
            map[c.brand_name].push(c);
        }
        return map;
    }, [filtered]);

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                        Campanhas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Gerencie todas as campanhas das marcas
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

            {/* Filtros */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
                <TextField
                    size="small"
                    placeholder="Buscar campanha ou marca..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="draft">Rascunho</MenuItem>
                        <MenuItem value="active">Ativa</MenuItem>
                        <MenuItem value="paused">Pausada</MenuItem>
                        <MenuItem value="completed">Concluída</MenuItem>
                        <MenuItem value="cancelled">Cancelada</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Marca</InputLabel>
                    <Select value={filterBrand} label="Marca" onChange={(e) => setFilterBrand(e.target.value)}>
                        <MenuItem value="all">Todas as marcas</MenuItem>
                        {brands.map((b) => (
                            <MenuItem key={b} value={b}>{b}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Nenhuma campanha encontrada.
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={3}>
                    {Object.entries(grouped).map(([brandName, brandCampaigns]) => {
                        const firstCampaign = brandCampaigns[0];
                        return (
                            <Paper
                                key={brandName}
                                elevation={0}
                                sx={{ borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', overflow: 'hidden' }}
                            >
                                {/* Brand header */}
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1.5}
                                    sx={{
                                        px: { xs: 2, sm: 3 },
                                        py: 1.5,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Avatar
                                        src={firstCampaign.brand_logo}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                                            color: 'primary.main',
                                            fontSize: 14,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {brandName.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                        {brandName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {brandCampaigns.length} campanha{brandCampaigns.length !== 1 ? 's' : ''}
                                    </Typography>
                                </Stack>

                                {/* Campaigns in this brand */}
                                <Stack divider={<Divider />}>
                                    {brandCampaigns.map((campaign) => {
                                        const cfg = STATUS_CONFIG[campaign.status];
                                        const isUpdating = updatingId === campaign._id;

                                        return (
                                            <Stack
                                                key={campaign._id}
                                                direction={{ xs: 'column', sm: 'row' }}
                                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                                spacing={{ xs: 1, sm: 2 }}
                                                sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}
                                            >
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                fontSize: { xs: '0.82rem', sm: '0.875rem' },
                                                            }}
                                                        >
                                                            {campaign.title}
                                                        </Typography>
                                                        <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, height: 20 }} />
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                                        <Typography variant="caption" color="text.secondary">
                                                            {CONTENT_TYPE_LABELS[campaign.content_type] || campaign.content_type}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">·</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {campaign.slots_unlimited ? 'Sem limite de vagas' : `${campaign.slots_filled}/${campaign.slots} vagas`}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">·</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {campaign.applications_count} candidatura{campaign.applications_count !== 1 ? 's' : ''}
                                                        </Typography>
                                                        {campaign.niches.length > 0 && (
                                                            <>
                                                                <Typography variant="caption" color="text.secondary">·</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {campaign.niches.slice(0, 2).join(', ')}
                                                                    {campaign.niches.length > 2 ? ` +${campaign.niches.length - 2}` : ''}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </Box>

                                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                                    {/* Status actions */}
                                                    {campaign.status === 'draft' && (
                                                        <Tooltip title="Ativar campanha">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => updateStatus(campaign._id, 'active')}
                                                                    disabled={isUpdating}
                                                                >
                                                                    {isUpdating ? <CircularProgress size={16} /> : <ActivateIcon fontSize="small" />}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                    {campaign.status === 'active' && (
                                                        <Tooltip title="Pausar campanha">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="warning"
                                                                    onClick={() => updateStatus(campaign._id, 'paused')}
                                                                    disabled={isUpdating}
                                                                >
                                                                    {isUpdating ? <CircularProgress size={16} /> : <PauseIcon fontSize="small" />}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                    {campaign.status === 'paused' && (
                                                        <Tooltip title="Reativar campanha">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => updateStatus(campaign._id, 'active')}
                                                                    disabled={isUpdating}
                                                                >
                                                                    {isUpdating ? <CircularProgress size={16} /> : <ActivateIcon fontSize="small" />}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                    {['active', 'paused', 'draft'].includes(campaign.status) && (
                                                        <Tooltip title="Cancelar campanha">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => updateStatus(campaign._id, 'cancelled')}
                                                                    disabled={isUpdating}
                                                                >
                                                                    <CancelIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title="Ver candidaturas">
                                                        <Badge
                                                            badgeContent={campaign.applications_count}
                                                            color="primary"
                                                            max={99}
                                                            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                component={Link}
                                                                href={`/dashboard/admin/campanhas/${campaign._id}/candidaturas`}
                                                            >
                                                                <GroupIcon fontSize="small" />
                                                            </IconButton>
                                                        </Badge>
                                                    </Tooltip>

                                                    <Tooltip title="Editar campanha">
                                                        <IconButton
                                                            size="small"
                                                            component={Link}
                                                            href={`/dashboard/admin/campanhas/${campaign._id}`}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
}

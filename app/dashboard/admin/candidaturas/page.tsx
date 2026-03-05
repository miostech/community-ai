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
    Alert,
    Avatar,
    Tabs,
    Tab,
    Divider,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    alpha,
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    OpenInNew as OpenProfileIcon,
    Instagram as InstagramIcon,
    CheckCircleOutline as IsCustomerIcon,
    Campaign as CampaignIcon,
} from '@mui/icons-material';

interface Creator {
    _id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    link_instagram?: string;
    link_tiktok?: string;
    niches?: string[];
    category?: string;
    address_city?: string;
    address_state?: string;
}

interface CampaignRef {
    _id: string;
    title: string;
    brand_name: string;
    status: string;
}

interface Application {
    _id: string;
    campaign_id: string | CampaignRef;
    creator_account_id: Creator;
    pitch: string;
    content_proposal?: string;
    is_customer: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    rejection_reason?: string;
    approved_at?: string;
    rejected_at?: string;
    created_at: string;
}

interface Campaign {
    _id: string;
    title: string;
    brand_name: string;
    status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
    pending: { label: 'Pendente', color: 'warning' },
    approved: { label: 'Aprovada', color: 'success' },
    rejected: { label: 'Recusada', color: 'error' },
    completed: { label: 'Concluída', color: 'info' },
    cancelled: { label: 'Cancelada', color: 'default' },
};

function getCampaignId(app: Application): string {
    const c = app.campaign_id;
    return typeof c === 'string' ? c : (c as CampaignRef)?._id ?? '';
}

function getCampaignLabel(app: Application): string {
    const c = app.campaign_id;
    if (typeof c === 'string') return '';
    const ref = c as CampaignRef;
    return ref ? `${ref.title} (${ref.brand_name})` : '';
}

export default function AdminCandidaturasPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);
    const [filterCampaignId, setFilterCampaignId] = useState<string>('all');
    const [activeTab, setActiveTab] = useState(0);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        (async () => {
            setLoadingCampaigns(true);
            try {
                const res = await fetch('/api/campaigns?admin=true&limit=100');
                const data = await res.json();
                setCampaigns(data.campaigns || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCampaigns(false);
            }
        })();
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [filterCampaignId]);

    async function fetchApplications() {
        setLoading(true);
        try {
            const url =
                filterCampaignId === 'all'
                    ? '/api/admin/applications'
                    : `/api/admin/applications?campaign_id=${encodeURIComponent(filterCampaignId)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao carregar');
            setApplications(data.applications || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar candidaturas');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(app: Application) {
        const campaignId = getCampaignId(app);
        const appId = app._id;
        setProcessingId(appId);
        setError('');
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' }),
            });
            const data = await res.json();
            if (res.ok) {
                setApplications((prev) =>
                    prev.map((a) =>
                        a._id === appId ? { ...a, status: 'approved', approved_at: new Date().toISOString() } : a
                    )
                );
            } else {
                setError(data.error || 'Erro ao aprovar candidatura.');
            }
        } catch {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setProcessingId(null);
        }
    }

    function openRejectDialog(appId: string) {
        setRejectingAppId(appId);
        setRejectionReason('');
        setRejectDialogOpen(true);
    }

    async function handleReject() {
        if (!rejectingAppId) return;
        const app = applications.find((a) => a._id === rejectingAppId);
        if (!app) return;
        const campaignId = getCampaignId(app);
        setProcessingId(rejectingAppId);
        setError('');
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/applications/${rejectingAppId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason }),
            });
            const data = await res.json();
            if (res.ok) {
                setApplications((prev) =>
                    prev.map((a) =>
                        a._id === rejectingAppId
                            ? {
                                  ...a,
                                  status: 'rejected',
                                  rejection_reason: rejectionReason,
                                  rejected_at: new Date().toISOString(),
                              }
                            : a
                    )
                );
                setRejectDialogOpen(false);
            } else {
                setError(data.error || 'Erro ao recusar candidatura.');
            }
        } catch {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setProcessingId(null);
        }
    }

    const counts = useMemo(
        () => ({
            pending: applications.filter((a) => a.status === 'pending').length,
            approved: applications.filter((a) => a.status === 'approved').length,
            rejected: applications.filter((a) => a.status === 'rejected').length,
            all: applications.length,
        }),
        [applications]
    );

    const filtered = useMemo(() => {
        if (activeTab === 0) return applications.filter((a) => a.status === 'pending');
        if (activeTab === 1) return applications.filter((a) => a.status === 'approved');
        if (activeTab === 2) return applications.filter((a) => a.status === 'rejected');
        return applications;
    }, [applications, activeTab]);

    return (
        <Box
            sx={{
                maxWidth: 960,
                mx: 'auto',
                px: { xs: 1.5, sm: 3 },
                py: { xs: 1.5, sm: 4 },
                pb: { xs: 12, sm: 4 },
            }}
        >
            <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                    Candidaturas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Visualize e gerencie todas as candidaturas. Filtre por campanha abaixo.
                </Typography>
            </Stack>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    p: 2,
                    mb: 2,
                }}
            >
                <FormControl size="small" fullWidth sx={{ minWidth: 200 }}>
                    <InputLabel id="filter-campaign-label">Campanha</InputLabel>
                    <Select
                        labelId="filter-campaign-label"
                        label="Campanha"
                        value={filterCampaignId}
                        onChange={(e) => setFilterCampaignId(e.target.value)}
                        disabled={loadingCampaigns}
                    >
                        <MenuItem value="all">Todas as campanhas</MenuItem>
                        {campaigns.map((c) => (
                            <MenuItem key={c._id} value={c._id}>
                                {c.title} — {c.brand_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Paper
                elevation={0}
                sx={{
                    borderRadius: { xs: 2, sm: 3 },
                    border: 1,
                    borderColor: 'divider',
                    overflow: 'hidden',
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        px: { xs: 0, sm: 1 },
                        minHeight: { xs: 48, sm: 48 },
                        '& .MuiTab-root': {
                            minHeight: { xs: 48, sm: 48 },
                            px: { xs: 1.25, sm: 2 },
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        },
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    <Tab
                        label={
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <span>Pendentes</span>
                                {counts.pending > 0 && (
                                    <Chip
                                        label={counts.pending}
                                        size="small"
                                        color="warning"
                                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                                    />
                                )}
                            </Stack>
                        }
                    />
                    <Tab
                        label={
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <span>Aprovadas</span>
                                {counts.approved > 0 && (
                                    <Chip
                                        label={counts.approved}
                                        size="small"
                                        color="success"
                                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                                    />
                                )}
                            </Stack>
                        }
                    />
                    <Tab label="Recusadas" />
                    <Tab label={`Todas (${counts.all})`} />
                </Tabs>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                            Nenhuma candidatura nesta categoria.
                        </Typography>
                    </Box>
                ) : (
                    <Stack divider={<Divider />}>
                        {filtered.map((app) => {
                            const creator = app.creator_account_id;
                            const fullName = `${creator.first_name} ${creator.last_name}`.trim();
                            const cfg = STATUS_CONFIG[app.status];
                            const isProcessing = processingId === app._id;
                            const campaignId = getCampaignId(app);
                            const campaignLabel = getCampaignLabel(app);

                            return (
                                <Box key={app._id} sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2.5 } }}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }}>
                                        <Stack
                                            direction="row"
                                            spacing={1.25}
                                            alignItems="flex-start"
                                            sx={{ flex: 1, minWidth: 0 }}
                                        >
                                            <Avatar
                                                src={creator.avatar_url}
                                                sx={{
                                                    width: { xs: 40, sm: 44 },
                                                    height: { xs: 40, sm: 44 },
                                                    flexShrink: 0,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                    color: 'primary.main',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {fullName.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    spacing={0.75}
                                                    flexWrap="wrap"
                                                    sx={{ gap: 0.5 }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                        }}
                                                    >
                                                        {fullName}
                                                    </Typography>
                                                    <Chip
                                                        label={cfg.label}
                                                        color={cfg.color}
                                                        size="small"
                                                        sx={{ fontSize: '0.65rem', fontWeight: 600, height: 18 }}
                                                    />
                                                    {app.is_customer && (
                                                        <Chip
                                                            icon={
                                                                <IsCustomerIcon sx={{ fontSize: '0.8rem !important' }} />
                                                            }
                                                            label="Cliente"
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.65rem', height: 18 }}
                                                        />
                                                    )}
                                                </Stack>

                                                {campaignLabel && (
                                                    <Button
                                                        component={Link}
                                                        href={`/dashboard/admin/campanhas/${campaignId}/candidaturas`}
                                                        size="small"
                                                        startIcon={<CampaignIcon sx={{ fontSize: '0.9rem' }} />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontSize: '0.75rem',
                                                            color: 'text.secondary',
                                                            p: 0,
                                                            minHeight: 'auto',
                                                            mt: 0.25,
                                                        }}
                                                    >
                                                        {campaignLabel}
                                                    </Button>
                                                )}

                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    sx={{ mt: 0.25 }}
                                                    flexWrap="wrap"
                                                >
                                                    {creator.link_instagram && (
                                                        <Stack direction="row" alignItems="center" spacing={0.25}>
                                                            <InstagramIcon
                                                                sx={{ fontSize: 12, color: 'text.secondary' }}
                                                            />
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                            >
                                                                {creator.link_instagram}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {creator.address_city && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                        >
                                                            · {creator.address_city}
                                                            {creator.address_state
                                                                ? `, ${creator.address_state}`
                                                                : ''}
                                                        </Typography>
                                                    )}
                                                </Stack>

                                                {creator.niches && creator.niches.length > 0 && (
                                                    <Stack
                                                        direction="row"
                                                        flexWrap="wrap"
                                                        gap={0.5}
                                                        sx={{ mt: 0.5 }}
                                                    >
                                                        {creator.niches.slice(0, 4).map((n) => (
                                                            <Chip
                                                                key={n}
                                                                label={n}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.65rem', height: 18 }}
                                                            />
                                                        ))}
                                                        {creator.niches.length > 4 && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ alignSelf: 'center' }}
                                                            >
                                                                +{creator.niches.length - 4}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                )}

                                                <Box
                                                    sx={{
                                                        mt: 1,
                                                        p: { xs: 1.25, sm: 1.5 },
                                                        borderRadius: 2,
                                                        bgcolor: 'action.hover',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontWeight: 600,
                                                            display: 'block',
                                                            mb: 0.5,
                                                            color: 'text.secondary',
                                                            textTransform: 'uppercase',
                                                            fontSize: '0.65rem',
                                                            letterSpacing: '0.05em',
                                                        }}
                                                    >
                                                        Pitch
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontSize: { xs: '0.78rem', sm: '0.82rem' },
                                                            lineHeight: 1.6,
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        {app.pitch}
                                                    </Typography>
                                                </Box>

                                                {app.content_proposal && (
                                                    <Box
                                                        sx={{
                                                            mt: 1,
                                                            p: { xs: 1.25, sm: 1.5 },
                                                            borderRadius: 2,
                                                            bgcolor: 'action.hover',
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontWeight: 600,
                                                                display: 'block',
                                                                mb: 0.5,
                                                                color: 'text.secondary',
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.65rem',
                                                                letterSpacing: '0.05em',
                                                            }}
                                                        >
                                                            Proposta de conteúdo
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                                                                lineHeight: 1.6,
                                                                wordBreak: 'break-word',
                                                            }}
                                                        >
                                                            {app.content_proposal}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {app.rejection_reason && (
                                                    <Alert
                                                        severity="error"
                                                        sx={{ mt: 1, py: 0.5, fontSize: '0.78rem' }}
                                                    >
                                                        Motivo da recusa: {app.rejection_reason}
                                                    </Alert>
                                                )}
                                            </Box>
                                        </Stack>

                                        <Stack
                                            direction={{ xs: 'column', sm: 'column' }}
                                            spacing={1}
                                            alignItems="stretch"
                                            flexShrink={0}
                                            sx={{
                                                width: { xs: '100%', sm: 'auto' },
                                                minWidth: { sm: 140 },
                                            }}
                                        >
                                            <Button
                                                component={Link}
                                                href={`/dashboard/admin/criadores/${creator._id}?campaignId=${campaignId}`}
                                                target="_blank"
                                                variant="outlined"
                                                size="small"
                                                startIcon={<OpenProfileIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    fontSize: { xs: '0.8rem', sm: '0.78rem' },
                                                    minHeight: { xs: 44, sm: 36 },
                                                }}
                                            >
                                                Ver perfil
                                            </Button>
                                            <Button
                                                component={Link}
                                                href={`/dashboard/admin/campanhas/${campaignId}/candidaturas`}
                                                variant="outlined"
                                                size="small"
                                                startIcon={<CampaignIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    fontSize: { xs: '0.8rem', sm: '0.78rem' },
                                                    minHeight: { xs: 44, sm: 36 },
                                                }}
                                            >
                                                Ver na campanha
                                            </Button>
                                            {app.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={
                                                            isProcessing ? (
                                                                <CircularProgress size={14} color="inherit" />
                                                            ) : (
                                                                <ApproveIcon />
                                                            )
                                                        }
                                                        onClick={() => handleApprove(app)}
                                                        disabled={!!isProcessing}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            fontSize: { xs: '0.8rem', sm: '0.78rem' },
                                                            minHeight: { xs: 44, sm: 36 },
                                                        }}
                                                    >
                                                        Aprovar
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<RejectIcon />}
                                                        onClick={() => openRejectDialog(app._id)}
                                                        disabled={!!isProcessing}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            fontSize: { xs: '0.8rem', sm: '0.78rem' },
                                                            minHeight: { xs: 44, sm: 36 },
                                                        }}
                                                    >
                                                        Recusar
                                                    </Button>
                                                </>
                                            )}
                                        </Stack>
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Paper>

            <Dialog
                open={rejectDialogOpen}
                onClose={() => setRejectDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Recusar candidatura
                </DialogTitle>
                <DialogContent sx={{ pt: { xs: 0, sm: 2 } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Você pode informar um motivo para o creator entender por que foi recusado (opcional).
                    </Typography>
                    <TextField
                        label="Motivo da recusa (opcional)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        fullWidth
                        multiline
                        rows={isMobile ? 4 : 3}
                        size="small"
                        placeholder="Ex: Perfil não se encaixa no nicho da campanha..."
                        sx={{ '& .MuiInputBase-root': { fontSize: { xs: '16px', sm: 'inherit' } } }}
                    />
                </DialogContent>
                <DialogActions
                    sx={{
                        px: { xs: 2, sm: 3 },
                        pb: { xs: 3, sm: 2 },
                        pt: 0,
                        flexDirection: { xs: 'column-reverse', sm: 'row' },
                        gap: 1,
                    }}
                >
                    <Button
                        onClick={() => setRejectDialogOpen(false)}
                        sx={{
                            textTransform: 'none',
                            width: { xs: '100%', sm: 'auto' },
                            minHeight: { xs: 44, sm: 36 },
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReject}
                        variant="contained"
                        color="error"
                        disabled={processingId === rejectingAppId}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            width: { xs: '100%', sm: 'auto' },
                            minHeight: { xs: 44, sm: 36 },
                        }}
                    >
                        {processingId === rejectingAppId ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : (
                            'Confirmar recusa'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

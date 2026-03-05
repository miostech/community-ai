'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    OpenInNew as OpenProfileIcon,
    Instagram as InstagramIcon,
    CheckCircleOutline as IsCustomerIcon,
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

interface Application {
    _id: string;
    campaign_id: string;
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

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
    pending: { label: 'Pendente', color: 'warning' },
    approved: { label: 'Aprovada', color: 'success' },
    rejected: { label: 'Recusada', color: 'error' },
    completed: { label: 'Concluída', color: 'info' },
    cancelled: { label: 'Cancelada', color: 'default' },
};

export default function CandidaturasPage() {
    const theme = useTheme();
    const params = useParams();
    const campaignId = params.id as string;

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Reject dialog
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchApplications();
    }, [campaignId]);

    async function fetchApplications() {
        setLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/applications`);
            const data = await res.json();
            setApplications(data.applications || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(appId: string) {
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
                    prev.map((a) => (a._id === appId ? { ...a, status: 'approved', approved_at: new Date().toISOString() } : a))
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
                            ? { ...a, status: 'rejected', rejection_reason: rejectionReason, rejected_at: new Date().toISOString() }
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

    const counts = useMemo(() => ({
        pending: applications.filter((a) => a.status === 'pending').length,
        approved: applications.filter((a) => a.status === 'approved').length,
        rejected: applications.filter((a) => a.status === 'rejected').length,
        all: applications.length,
    }), [applications]);

    const filtered = useMemo(() => {
        if (activeTab === 0) return applications.filter((a) => a.status === 'pending');
        if (activeTab === 1) return applications.filter((a) => a.status === 'approved');
        if (activeTab === 2) return applications.filter((a) => a.status === 'rejected');
        return applications;
    }, [applications, activeTab]);

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Button
                    component={Link}
                    href={`/dashboard/admin/campanhas/${campaignId}`}
                    startIcon={<ArrowBackIcon />}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Voltar à campanha
                </Button>
            </Stack>

            <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                    Candidaturas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {applications.length} candidatura{applications.length !== 1 ? 's' : ''} recebida{applications.length !== 1 ? 's' : ''}
                </Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper elevation={0} sx={{ borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label={
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <span>Pendentes</span>
                                {counts.pending > 0 && (
                                    <Chip label={counts.pending} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                                )}
                            </Stack>
                        }
                    />
                    <Tab
                        label={
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <span>Aprovadas</span>
                                {counts.approved > 0 && (
                                    <Chip label={counts.approved} size="small" color="success" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
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

                            return (
                                <Box key={app._id} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        {/* Creator info */}
                                        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                                            <Avatar
                                                src={creator.avatar_url}
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    flexShrink: 0,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                    color: 'primary.main',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {fullName.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                                        {fullName}
                                                    </Typography>
                                                    <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, height: 18 }} />
                                                    {app.is_customer && (
                                                        <Chip
                                                            icon={<IsCustomerIcon sx={{ fontSize: '0.8rem !important' }} />}
                                                            label="Já é cliente"
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.65rem', height: 18 }}
                                                        />
                                                    )}
                                                </Stack>

                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                                                    {creator.link_instagram && (
                                                        <Stack direction="row" alignItems="center" spacing={0.25}>
                                                            <InstagramIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {creator.link_instagram}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {creator.address_city && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            · {creator.address_city}{creator.address_state ? `, ${creator.address_state}` : ''}
                                                        </Typography>
                                                    )}
                                                </Stack>

                                                {creator.niches && creator.niches.length > 0 && (
                                                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
                                                        {creator.niches.slice(0, 4).map((n) => (
                                                            <Chip key={n} label={n} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                                                        ))}
                                                        {creator.niches.length > 4 && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                                                +{creator.niches.length - 4}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                )}

                                                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                                                        Pitch
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem' }, lineHeight: 1.6 }}>
                                                        {app.pitch}
                                                    </Typography>
                                                </Box>

                                                {app.content_proposal && (
                                                    <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                                                            Proposta de conteúdo
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem' }, lineHeight: 1.6 }}>
                                                            {app.content_proposal}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {app.rejection_reason && (
                                                    <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '0.78rem' }}>
                                                        Motivo da recusa: {app.rejection_reason}
                                                    </Alert>
                                                )}
                                            </Box>
                                        </Stack>

                                        {/* Actions */}
                                        <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1} alignItems={{ xs: 'center', sm: 'flex-end' }} flexShrink={0}>
                                            <Tooltip title="Ver portfólio do creator">
                                                <IconButton
                                                    size="small"
                                                    component={Link}
                                                    href={`/dashboard/admin/criadores/${creator._id}`}
                                                    target="_blank"
                                                >
                                                    <OpenProfileIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {app.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={isProcessing ? <CircularProgress size={14} color="inherit" /> : <ApproveIcon />}
                                                        onClick={() => handleApprove(app._id)}
                                                        disabled={isProcessing}
                                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', minWidth: 100 }}
                                                    >
                                                        Aprovar
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<RejectIcon />}
                                                        onClick={() => openRejectDialog(app._id)}
                                                        disabled={isProcessing}
                                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', minWidth: 100 }}
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

            {/* Reject dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Recusar candidatura</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Você pode informar um motivo para o creator entender por que foi recusado (opcional).
                    </Typography>
                    <TextField
                        label="Motivo da recusa (opcional)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        placeholder="Ex: Perfil não se encaixa no nicho da campanha..."
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setRejectDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReject}
                        variant="contained"
                        color="error"
                        disabled={processingId === rejectingAppId}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {processingId === rejectingAppId ? <CircularProgress size={18} color="inherit" /> : 'Confirmar recusa'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Box,
    Typography,
    Stack,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Badge,
    ButtonGroup,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Group as GroupIcon,
    PlayArrow as ActivateIcon,
    Pause as PauseIcon,
    CheckCircle as CompleteIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { CampaignForm, CampaignFormData } from '@/components/admin/CampaignForm';

interface CampaignData {
    _id: string;
    brand_name: string;
    brand_logo?: string;
    brand_website?: string;
    brand_instagram?: string;
    title: string;
    description: string;
    briefing: string;
    content_type: string;
    content_usage: string;
    category: string;
    niches: string[];
    slots: number;
    slots_filled: number;
    budget_per_creator?: number;
    includes_product: boolean;
    product_description?: string;
    deliverables: string[];
    application_deadline?: string;
    content_deadline?: string;
    start_date?: string;
    status: string;
    applications_count: number;
    filters?: {
        gender?: string;
        min_age?: number;
        max_age?: number;
        min_followers?: number;
        max_followers?: number;
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
    draft: { label: 'Rascunho', color: 'default' },
    active: { label: 'Ativa', color: 'success' },
    paused: { label: 'Pausada', color: 'warning' },
    completed: { label: 'Concluída', color: 'info' },
    cancelled: { label: 'Cancelada', color: 'error' },
};

function toDateInput(dateStr?: string): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
}

export default function EditCampanhaPage() {
    const params = useParams();
    const id = params.id as string;

    const [campaign, setCampaign] = useState<CampaignData | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState('');
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!id) return;
        fetchCampaign();
        fetchPendingCount();
    }, [id]);

    async function fetchCampaign() {
        setLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${id}`);
            const data = await res.json();
            if (res.ok) setCampaign(data.campaign);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchPendingCount() {
        try {
            const res = await fetch(`/api/campaigns/${id}/applications`);
            const data = await res.json();
            const pending = (data.applications || []).filter((a: { status: string }) => a.status === 'pending').length;
            setPendingCount(pending);
        } catch {
            // ignore
        }
    }

    async function updateStatus(newStatus: string) {
        setStatusLoading(true);
        setStatusError('');
        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (res.ok) {
                setCampaign((prev) => prev ? { ...prev, status: newStatus } : prev);
            } else {
                setStatusError(data.error || 'Erro ao atualizar status.');
            }
        } catch {
            setStatusError('Erro ao conectar com o servidor.');
        } finally {
            setStatusLoading(false);
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!campaign) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Campanha não encontrada.</Alert>
            </Box>
        );
    }

    const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;

    const initialData: Partial<CampaignFormData> = {
        brand_name: campaign.brand_name,
        brand_logo: campaign.brand_logo || '',
        brand_website: campaign.brand_website || '',
        brand_instagram: campaign.brand_instagram || '',
        title: campaign.title,
        description: campaign.description,
        briefing: campaign.briefing,
        content_type: campaign.content_type,
        content_usage: campaign.content_usage,
        category: campaign.category || '',
        niches: campaign.niches || [],
        slots: campaign.slots,
        budget_per_creator: campaign.budget_per_creator ? String(campaign.budget_per_creator / 100) : '',
        includes_product: campaign.includes_product,
        product_description: campaign.product_description || '',
        deliverables: campaign.deliverables || [],
        application_deadline: toDateInput(campaign.application_deadline),
        content_deadline: toDateInput(campaign.content_deadline),
        start_date: toDateInput(campaign.start_date),
        status: campaign.status,
        filters: {
            gender: campaign.filters?.gender || 'todos',
            min_age: campaign.filters?.min_age ? String(campaign.filters.min_age) : '',
            max_age: campaign.filters?.max_age ? String(campaign.filters.max_age) : '',
            min_followers: campaign.filters?.min_followers ? String(campaign.filters.min_followers) : '',
            max_followers: campaign.filters?.max_followers ? String(campaign.filters.max_followers) : '',
        },
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Button
                    component={Link}
                    href="/dashboard/admin/campanhas"
                    startIcon={<ArrowBackIcon />}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Campanhas
                </Button>
            </Stack>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: { xs: 2, sm: 3 } }}
            >
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                            {campaign.title}
                        </Typography>
                        <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600 }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {campaign.brand_name} · {campaign.slots_filled}/{campaign.slots} vagas preenchidas
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Badge badgeContent={pendingCount} color="error" max={99}>
                        <Button
                            component={Link}
                            href={`/dashboard/admin/campanhas/${id}/candidaturas`}
                            variant="outlined"
                            startIcon={<GroupIcon />}
                            size="small"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Candidaturas
                        </Button>
                    </Badge>

                    <ButtonGroup size="small" disabled={statusLoading}>
                        {campaign.status !== 'active' && !['completed', 'cancelled'].includes(campaign.status) && (
                            <Button
                                color="success"
                                startIcon={<ActivateIcon />}
                                onClick={() => updateStatus('active')}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Ativar
                            </Button>
                        )}
                        {campaign.status === 'active' && (
                            <Button
                                color="warning"
                                startIcon={<PauseIcon />}
                                onClick={() => updateStatus('paused')}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Pausar
                            </Button>
                        )}
                        {['active', 'paused'].includes(campaign.status) && (
                            <Button
                                color="info"
                                startIcon={<CompleteIcon />}
                                onClick={() => updateStatus('completed')}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Concluir
                            </Button>
                        )}
                        {!['completed', 'cancelled'].includes(campaign.status) && (
                            <Button
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => updateStatus('cancelled')}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Cancelar
                            </Button>
                        )}
                    </ButtonGroup>
                </Stack>
            </Stack>

            {statusError && <Alert severity="error" sx={{ mb: 2 }}>{statusError}</Alert>}

            <CampaignForm mode="edit" campaignId={id} initialData={initialData} />
        </Box>
    );
}

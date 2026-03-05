'use client';

import React, { useEffect, useState } from 'react';
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
    Divider,
    alpha,
    useTheme,
    Grid,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Instagram as InstagramIcon,
    YouTube as YouTubeIcon,
    OpenInNew as OpenInNewIcon,
    Badge as BadgeIcon,
    Star as StarIcon,
} from '@mui/icons-material';

interface Creator {
    _id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url?: string;
    link_instagram?: string;
    link_tiktok?: string;
    link_youtube?: string;
    birth_date?: string;
    gender?: string;
    category?: string;
    niches?: string[];
    address_country?: string;
    address_state?: string;
    address_city?: string;
    link_media_kit?: string;
    portfolio_videos?: string[];
    role?: string;
    is_founding_member?: boolean;
    followers_at_signup?: number;
    plan?: string;
    created_at?: string;
}

interface ApplicationEntry {
    _id: string;
    campaign_id: string;
    campaign?: {
        title: string;
        brand_name: string;
        brand_logo?: string;
        status: string;
    } | null;
    pitch: string;
    status: string;
    rejection_reason?: string;
    created_at: string;
}

const GENDER_LABELS: Record<string, string> = {
    masculino: 'Masculino',
    feminino: 'Feminino',
    nao_binario: 'Não-binário',
    prefiro_nao_dizer: 'Prefiro não dizer',
};

const CATEGORY_LABELS: Record<string, string> = {
    ugc: 'UGC Creator',
    influencer: 'Influencer',
    ambos: 'UGC + Influencer',
};

const APP_STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
    pending: { label: 'Pendente', color: 'warning' },
    approved: { label: 'Aprovada', color: 'success' },
    rejected: { label: 'Recusada', color: 'error' },
    completed: { label: 'Concluída', color: 'info' },
    cancelled: { label: 'Cancelada', color: 'default' },
};

function getVideoEmbedUrl(url: string): string | null {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            const videoId = u.searchParams.get('v') || u.pathname.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (u.hostname.includes('vimeo.com')) {
            const videoId = u.pathname.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}`;
        }
    } catch {
        // not a valid URL
    }
    return null;
}

export default function CreatorPortfolioPage() {
    const theme = useTheme();
    const params = useParams();
    const accountId = params.accountId as string;

    const [creator, setCreator] = useState<Creator | null>(null);
    const [applications, setApplications] = useState<ApplicationEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!accountId) return;
        fetchCreator();
    }, [accountId]);

    async function fetchCreator() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/creators/${accountId}`);
            const data = await res.json();
            if (res.ok) {
                setCreator(data.creator);
                setApplications(data.applications || []);
            } else {
                setError(data.error || 'Erro ao buscar creator.');
            }
        } catch {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !creator) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || 'Creator não encontrado.'}</Alert>
            </Box>
        );
    }

    const fullName = `${creator.first_name} ${creator.last_name}`.trim();
    const location = [creator.address_city, creator.address_state, creator.address_country].filter(Boolean).join(', ');

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Button
                    onClick={() => window.history.back()}
                    startIcon={<ArrowBackIcon />}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Voltar
                </Button>
            </Stack>

            {/* Header do creator */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                    <Avatar
                        src={creator.avatar_url}
                        sx={{
                            width: { xs: 72, sm: 88 },
                            height: { xs: 72, sm: 88 },
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                            fontSize: 32,
                            fontWeight: 700,
                        }}
                    >
                        {fullName.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                        <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={1} flexWrap="wrap">
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                                {fullName}
                            </Typography>
                            {creator.is_founding_member && (
                                <Chip
                                    icon={<StarIcon sx={{ fontSize: '0.75rem !important' }} />}
                                    label="Fundador"
                                    size="small"
                                    color="primary"
                                    sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }}
                                />
                            )}
                            {creator.role && creator.role !== 'user' && (
                                <Chip label={creator.role} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, height: 20 }} />
                            )}
                        </Stack>

                        {creator.category && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {CATEGORY_LABELS[creator.category] || creator.category}
                            </Typography>
                        )}

                        {location && (
                            <Typography variant="caption" color="text.secondary">
                                {location}
                            </Typography>
                        )}

                        <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mt: 1.5 }} flexWrap="wrap">
                            {creator.link_instagram && (
                                <Button
                                    href={`https://instagram.com/${creator.link_instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<InstagramIcon />}
                                    size="small"
                                    variant="outlined"
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                                >
                                    {creator.link_instagram}
                                </Button>
                            )}
                            {creator.link_tiktok && (
                                <Button
                                    href={`https://tiktok.com/@${creator.link_tiktok.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    variant="outlined"
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                                >
                                    TikTok: {creator.link_tiktok}
                                </Button>
                            )}
                            {creator.link_youtube && (
                                <Button
                                    href={creator.link_youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<YouTubeIcon />}
                                    size="small"
                                    variant="outlined"
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                                >
                                    YouTube
                                </Button>
                            )}
                            {creator.link_media_kit && (
                                <Button
                                    href={creator.link_media_kit}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<BadgeIcon />}
                                    endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem !important' }} />}
                                    size="small"
                                    variant="contained"
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.78rem',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                                    }}
                                >
                                    Media Kit
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Dados do perfil */}
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {creator.gender && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Gênero
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {GENDER_LABELS[creator.gender] || creator.gender}
                            </Typography>
                        </Grid>
                    )}
                    {creator.birth_date && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Data de nascimento
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {new Date(creator.birth_date).toLocaleDateString('pt-BR')}
                            </Typography>
                        </Grid>
                    )}
                    {creator.followers_at_signup && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Seguidores no cadastro
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {creator.followers_at_signup.toLocaleString('pt-BR')}
                            </Typography>
                        </Grid>
                    )}
                    {creator.plan && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Plano
                            </Typography>
                            <Chip label={creator.plan} size="small" color={creator.plan === 'pro' ? 'primary' : 'default'} sx={{ fontSize: '0.7rem', fontWeight: 600, height: 20 }} />
                        </Grid>
                    )}
                </Grid>

                {creator.niches && creator.niches.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 1 }}>
                            Nichos
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            {creator.niches.map((n) => (
                                <Chip key={n} label={n} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
                            ))}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Portfólio de vídeos */}
            {creator.portfolio_videos && creator.portfolio_videos.length > 0 && (
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Portfólio de vídeos
                    </Typography>
                    <Grid container spacing={2}>
                        {creator.portfolio_videos.map((url, i) => {
                            const embedUrl = getVideoEmbedUrl(url);
                            return (
                                <Grid size={{ xs: 12, sm: 4 }} key={i}>
                                    <Box
                                        sx={{
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            border: 1,
                                            borderColor: 'divider',
                                            aspectRatio: '16/9',
                                            bgcolor: 'action.hover',
                                            position: 'relative',
                                        }}
                                    >
                                        {embedUrl ? (
                                            <iframe
                                                src={embedUrl}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 'none', position: 'absolute', inset: 0 }}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                                                <Button
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    endIcon={<OpenInNewIcon />}
                                                    size="small"
                                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                                >
                                                    Ver vídeo {i + 1}
                                                </Button>
                                            </Stack>
                                        )}
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>
            )}

            {/* Histórico de candidaturas */}
            <Paper elevation={0} sx={{ borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Histórico de candidaturas
                    </Typography>
                </Box>

                {applications.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Este creator ainda não se candidatou a nenhuma campanha.
                        </Typography>
                    </Box>
                ) : (
                    <Stack divider={<Divider />}>
                        {applications.map((app) => {
                            const cfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.pending;
                            return (
                                <Stack
                                    key={app._id.toString()}
                                    direction={{ xs: 'column', sm: 'row' }}
                                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                                    spacing={{ xs: 1, sm: 2 }}
                                    sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                        <Avatar
                                            src={app.campaign?.brand_logo}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                flexShrink: 0,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                color: 'primary.main',
                                                fontSize: 13,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {app.campaign?.brand_name?.charAt(0).toUpperCase() || '?'}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {app.campaign?.title || 'Campanha removida'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {app.campaign?.brand_name} · {new Date(app.created_at).toLocaleDateString('pt-BR')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                                        <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, height: 20 }} />
                                        {app.campaign && (
                                            <Button
                                                component={Link}
                                                href={`/dashboard/admin/campanhas/${app.campaign_id}/candidaturas`}
                                                size="small"
                                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                                            >
                                                Ver
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            );
                        })}
                    </Stack>
                )}
            </Paper>
        </Box>
    );
}

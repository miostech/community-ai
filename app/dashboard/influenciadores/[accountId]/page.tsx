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
    Campaign as CampaignIcon,
    Instagram as InstagramIcon,
    YouTube as YouTubeIcon,
    OpenInNew as OpenInNewIcon,
    Badge as BadgeIcon,
    Star as StarIcon,
    Article as PostIcon,
    ChatBubble as CommentIcon,
    Favorite as LikeIcon,
    People as PeopleIcon,
    BarChart as BarChartIcon,
    Refresh as RefreshIcon,
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

interface SocialStatsForScore {
    instagram?: {
        followers: number | null;
        avg_likes: number | null;
        avg_comments: number | null;
    } | null;
    tiktok?: {
        followers: number | null;
        hearts: number | null;
        posts_count: number | null;
    } | null;
}

function calcIgEngagementScore(socialStats: SocialStatsForScore | null): number | null {
    const ig = socialStats?.instagram;
    if (!ig || !ig.followers || ig.followers <= 0) return null;
    if (ig.avg_likes == null && ig.avg_comments == null) return null;
    const rate = (((ig.avg_likes ?? 0) + (ig.avg_comments ?? 0)) / ig.followers) * 100;
    return Math.min(Math.round((rate / 6) * 100), 100);
}

function calcTtEngagementScore(socialStats: SocialStatsForScore | null): number | null {
    const tt = socialStats?.tiktok;
    if (!tt || !tt.followers || tt.followers <= 0 || tt.hearts == null || !tt.posts_count || tt.posts_count <= 0) return null;
    const avgHeartsPerPost = tt.hearts / tt.posts_count;
    const rate = (avgHeartsPerPost / tt.followers) * 100;
    return Math.min(Math.round((rate / 10) * 100), 100);
}

function getEngagementLevel(score: number): { label: string; color: 'error' | 'warning' | 'info' | 'success' } {
    if (score <= 30) return { label: 'Baixo', color: 'error' };
    if (score <= 60) return { label: 'Médio', color: 'warning' };
    if (score <= 80) return { label: 'Bom', color: 'info' };
    return { label: 'Excelente', color: 'success' };
}

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

interface DomeStats {
    ranking_position: number | null;
    ranking_week: string | null;
    ranking_wins: number;
}

export default function InfluencerProfilePage() {
    const theme = useTheme();
    const params = useParams();
    const accountId = params.accountId as string;

    const [creator, setCreator] = useState<Creator | null>(null);
    const [domeStats, setDomeStats] = useState<DomeStats | null>(null);
    const [applications, setApplications] = useState<ApplicationEntry[]>([]);
    const [stats, setStats] = useState({ posts_count: 0, comments_count: 0, likes_received: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    interface SocialStats {
        instagram: {
            username?: string;
            followers: number | null;
            following: number | null;
            posts_count: number | null;
            is_verified: boolean;
            avg_likes: number | null;
            avg_comments: number | null;
            recent_posts_sample: number;
        } | null;
        tiktok: {
            username?: string;
            followers: number | null;
            following: number | null;
            posts_count: number | null;
            hearts: number | null;
            is_verified: boolean;
        } | null;
    }
    const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
    const [socialLoading, setSocialLoading] = useState(false);
    const [socialError, setSocialError] = useState('');

    useEffect(() => {
        if (!accountId) return;
        fetchCreator();
        fetchSocialStats();
        fetch('/api/admin/influencers/' + accountId + '/dome-stats')
            .then((r) => r.json())
            .then((data) => setDomeStats({ ranking_position: data.ranking_position ?? null, ranking_week: data.ranking_week ?? null, ranking_wins: data.ranking_wins ?? 0 }))
            .catch(() => setDomeStats(null));
    }, [accountId]);

    useEffect(() => {
        if (!creator) return;
        const name = `${creator.first_name} ${creator.last_name}`.trim();
        const handle = creator.link_instagram
            ? `@${creator.link_instagram.replace('@', '')}`
            : creator.link_tiktok
            ? `@${creator.link_tiktok.replace('@', '')}`
            : null;
        document.title = handle ? `${name} (${handle}) — Influenciadores` : `${name} — Influenciadores`;
        return () => { document.title = 'Influenciadores — Dome'; };
    }, [creator]);

    async function fetchCreator() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/creators/${accountId}`);
            const data = await res.json();
            if (res.ok) {
                setCreator(data.creator);
                setApplications(data.applications || []);
                setStats(data.stats || { posts_count: 0, comments_count: 0, likes_received: 0 });
            } else {
                setError(data.error || 'Erro ao buscar creator.');
            }
        } catch {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchSocialStats() {
        setSocialLoading(true);
        setSocialError('');
        try {
            const res = await fetch(`/api/admin/creators/${accountId}/social-stats`);
            const data = await res.json();
            if (res.ok) {
                setSocialStats(data);
            } else {
                setSocialError(data.error || 'Erro ao buscar métricas sociais.');
            }
        } catch {
            setSocialError('Erro ao conectar com o servidor.');
        } finally {
            setSocialLoading(false);
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
                    component={Link}
                    href="/dashboard/influenciadores"
                    startIcon={<ArrowBackIcon />}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Voltar aos influenciadores
                </Button>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                    /
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {fullName}
                </Typography>
                {(creator.link_instagram || creator.link_tiktok) && (
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
                        @{(creator.link_instagram || creator.link_tiktok || '').replace('@', '')}
                    </Typography>
                )}
            </Stack>

            {/* Header do creator */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', mb: 3, position: 'relative' }}>
                {(() => {
                    const igScore = calcIgEngagementScore(socialStats);
                    const ttScore = calcTtEngagementScore(socialStats);
                    const scores = [igScore, ttScore].filter((s): s is number => s !== null);
                    if (scores.length === 0) return null;
                    const combined = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                    const { color, label } = getEngagementLevel(combined);
                    return (
                        <Box
                            title={`Engajamento geral: ${combined}/100`}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: (t) => t.palette[color].main,
                                boxShadow: (t) => `0 0 0 4px ${alpha(t.palette[color].main, 0.2)}`,
                                cursor: 'default',
                                zIndex: 1,
                            }}
                        >
                            <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                                {combined}
                            </Typography>
                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1, mt: 0.25, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {label}
                            </Typography>
                        </Box>
                    );
                })()}
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

                        {(() => {
                            const ig = socialStats?.instagram?.followers ?? 0;
                            const tt = socialStats?.tiktok?.followers ?? 0;
                            const totaisAtuais = ig + tt;
                            if (totaisAtuais > 0) {
                                return (
                                    <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 700, fontSize: '0.95rem' }}>
                                        {totaisAtuais.toLocaleString('pt-BR')} seguidores atuais
                                    </Typography>
                                );
                            }
                            if (creator.followers_at_signup != null && creator.followers_at_signup > 0) {
                                return (
                                    <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 700, fontSize: '0.95rem' }}>
                                        {creator.followers_at_signup.toLocaleString('pt-BR')} seguidores na entrada
                                    </Typography>
                                );
                            }
                            return null;
                        })()}

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
                    {(() => {
                        const igScore = calcIgEngagementScore(socialStats);
                        const ttScore = calcTtEngagementScore(socialStats);
                        if (igScore === null && ttScore === null) return null;
                        return (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.75 }}>
                                    Engajamento
                                </Typography>
                                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                    {igScore !== null && (() => {
                                        const level = getEngagementLevel(igScore);
                                        return (
                                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                                <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ec4899, #7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <InstagramIcon sx={{ fontSize: 13, color: 'white' }} />
                                                </Box>
                                                <Chip
                                                    label={`${igScore}/100`}
                                                    color={level.color}
                                                    size="small"
                                                    sx={{ fontWeight: 800, fontSize: '0.72rem', height: 20 }}
                                                />
                                                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: `${level.color}.main` }}>
                                                    {level.label}
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                    {ttScore !== null && (() => {
                                        const level = getEngagementLevel(ttScore);
                                        return (
                                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#010101', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a4.85 4.85 0 0 0 3.77 4.22v-3.29a4.85 4.85 0 0 1-1-.4z" />
                                                    </svg>
                                                </Box>
                                                <Chip
                                                    label={`${ttScore}/100`}
                                                    color={level.color}
                                                    size="small"
                                                    sx={{ fontWeight: 800, fontSize: '0.72rem', height: 20 }}
                                                />
                                                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: `${level.color}.main` }}>
                                                    {level.label}
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                            </Grid>
                        );
                    })()}
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                            Campanhas na Dome
                        </Typography>
                        <Stack direction="row" alignItems="baseline" spacing={0.75}>
                            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1 }}>
                                {applications.filter(a => ['completed', 'approved'].includes(a.status)).length}
                            </Typography>
                            {applications.length > 0 && (
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                                    de {applications.length} candidatura{applications.length !== 1 ? 's' : ''}
                                </Typography>
                            )}
                        </Stack>
                    </Grid>
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

            {/* Na Dome */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', mb: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Na Dome
                    </Typography>
                    <Button
                        component={Link}
                        href="/dashboard/admin/campanhas"
                        startIcon={<CampaignIcon />}
                        variant="contained"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        }}
                    >
                        Convidar para campanha
                    </Button>
                </Stack>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {creator.created_at && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Data de entrada
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {new Date(creator.created_at).toLocaleDateString('pt-BR')}
                            </Typography>
                        </Grid>
                    )}
                    {creator.followers_at_signup != null && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Seguidores na entrada
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {creator.followers_at_signup.toLocaleString('pt-BR')}
                            </Typography>
                        </Grid>
                    )}
                    {domeStats && domeStats.ranking_position != null && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Posição no ranking
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                #{domeStats.ranking_position}
                                {domeStats.ranking_week && (
                                    <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                                        ({domeStats.ranking_week})
                                    </Typography>
                                )}
                            </Typography>
                        </Grid>
                    )}
                    {domeStats && domeStats.ranking_wins > 0 && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                                Vitórias no ranking
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {domeStats.ranking_wins}
                            </Typography>
                        </Grid>
                    )}
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', mb: 0.25 }}>
                            Campanhas na Dome
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {applications.filter((a) => ['completed', 'approved'].includes(a.status)).length}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Métricas das Redes Sociais via SearchAPI */}
            {(creator.link_instagram || creator.link_tiktok) && (
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', mb: 3 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <BarChartIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Métricas das Redes Sociais
                            </Typography>
                            {/* <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                                via SearchAPI
                            </Typography> */}
                        </Stack>
                        <Button
                            size="small"
                            startIcon={socialLoading ? <CircularProgress size={13} color="inherit" /> : <RefreshIcon sx={{ fontSize: 15 }} />}
                            onClick={fetchSocialStats}
                            disabled={socialLoading}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                            Atualizar
                        </Button>
                    </Stack>

                    {socialError && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{socialError}</Alert>
                    )}

                    {/* Skeleton enquanto carrega */}
                    {socialLoading && !socialStats && (
                        <Grid container spacing={2}>
                            {[creator.link_instagram, creator.link_tiktok].filter(Boolean).map((_, idx) => (
                                <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'action.hover' }} />
                                            <Box sx={{ width: 80, height: 14, borderRadius: 1, bgcolor: 'action.hover' }} />
                                        </Stack>
                                        <Grid container spacing={1.5}>
                                            {[1, 2, 3, 4].map((i) => (
                                                <Grid key={i} size={{ xs: 6 }}>
                                                    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover', height: 52 }} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* Dados carregados */}
                    {socialStats && (
                        <Grid container spacing={2}>
                            {/* Instagram */}
                            {socialStats.instagram && (
                                <Grid size={{ xs: 12, sm: socialStats.tiktok ? 6 : 12 }}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#e1306c', 0.2), bgcolor: alpha('#e1306c', 0.03) }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                            <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ec4899, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <InstagramIcon sx={{ fontSize: 16, color: 'white' }} />
                                            </Box>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Instagram</Typography>
                                            {socialStats.instagram.is_verified && (
                                                <Chip label="Verificado" size="small" color="primary" sx={{ fontSize: '0.6rem', height: 18 }} />
                                            )}
                                            {creator.link_instagram && (
                                                <Typography component="a" href={`https://instagram.com/${creator.link_instagram.replace('@','')}`} target="_blank" variant="caption" sx={{ color: 'text.disabled', textDecoration: 'none', '&:hover': { color: 'primary.main' }, ml: 'auto !important' }}>
                                                    @{creator.link_instagram.replace('@','')}
                                                </Typography>
                                            )}
                                        </Stack>
                                        <Grid container spacing={1}>
                                            {[
                                                { label: 'Seguidores', value: socialStats.instagram.followers, color: '#e1306c' },
                                                { label: 'Seguindo', value: socialStats.instagram.following, color: '#9333ea' },
                                                { label: 'Posts', value: socialStats.instagram.posts_count, color: '#6366f1' },
                                                { label: 'Média likes', value: socialStats.instagram.avg_likes, color: '#ec4899', sub: socialStats.instagram.recent_posts_sample > 0 ? `últimos ${socialStats.instagram.recent_posts_sample}` : null },
                                                { label: 'Média comentários', value: socialStats.instagram.avg_comments, color: '#0ea5e9' },
                                            ].map((m) => (
                                                <Grid key={m.label} size={{ xs: 6, sm: 4 }}>
                                                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: alpha(m.color, 0.07), border: '1px solid', borderColor: alpha(m.color, 0.18), textAlign: 'center' }}>
                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: m.color, mb: 0.25 }}>
                                                            {m.label}
                                                        </Typography>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1, color: 'text.primary' }}>
                                                            {m.value != null ? m.value.toLocaleString('pt-BR') : '—'}
                                                        </Typography>
                                                        {m.sub && <Typography sx={{ fontSize: '0.57rem', color: 'text.disabled', mt: 0.25 }}>{m.sub}</Typography>}
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </Grid>
                            )}

                            {/* TikTok */}
                            {socialStats.tiktok && (
                                <Grid size={{ xs: 12, sm: socialStats.instagram ? 6 : 12 }}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#ee1d52', 0.2), bgcolor: alpha('#010101', 0.03) }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a4.85 4.85 0 0 0 3.77 4.22v-3.29a4.85 4.85 0 0 1-1-.4z" />
                                                </svg>
                                            </Box>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>TikTok</Typography>
                                            {socialStats.tiktok.is_verified && (
                                                <Chip label="Verificado" size="small" color="primary" sx={{ fontSize: '0.6rem', height: 18 }} />
                                            )}
                                            {creator.link_tiktok && (
                                                <Typography component="a" href={`https://tiktok.com/@${creator.link_tiktok.replace('@','')}`} target="_blank" variant="caption" sx={{ color: 'text.disabled', textDecoration: 'none', '&:hover': { color: 'primary.main' }, ml: 'auto !important' }}>
                                                    @{creator.link_tiktok.replace('@','')}
                                                </Typography>
                                            )}
                                        </Stack>
                                        <Grid container spacing={1}>
                                            {[
                                                { label: 'Seguidores', value: socialStats.tiktok.followers, color: '#ee1d52' },
                                                { label: 'Seguindo', value: socialStats.tiktok.following, color: '#9333ea' },
                                                { label: 'Vídeos', value: socialStats.tiktok.posts_count, color: '#6366f1' },
                                                { label: 'Total de likes', value: socialStats.tiktok.hearts, color: '#ec4899', sub: 'hearts acumulados' },
                                            ].map((m) => (
                                                <Grid key={m.label} size={{ xs: 6 }}>
                                                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: alpha(m.color, 0.07), border: '1px solid', borderColor: alpha(m.color, 0.18), textAlign: 'center' }}>
                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: m.color, mb: 0.25 }}>
                                                            {m.label}
                                                        </Typography>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1, color: 'text.primary' }}>
                                                            {m.value != null ? m.value.toLocaleString('pt-BR') : '—'}
                                                        </Typography>
                                                        {m.sub && <Typography sx={{ fontSize: '0.57rem', color: 'text.disabled', mt: 0.25 }}>{m.sub}</Typography>}
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </Grid>
                            )}

                            {/* Nenhuma rede retornou dados */}
                            {!socialStats.instagram && !socialStats.tiktok && (
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.82rem' }}>
                                            Não foi possível obter dados públicos para este creator.
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Paper>
            )}

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
                                            aspectRatio: '9/16',
                                            bgcolor: 'black',
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
                                            <Box
                                                component="video"
                                                src={url}
                                                controls
                                                playsInline
                                                preload="metadata"
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        )}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 6,
                                                left: 6,
                                                bgcolor: 'rgba(0,0,0,0.55)',
                                                backdropFilter: 'blur(4px)',
                                                borderRadius: 1,
                                                px: 0.75,
                                                py: 0.25,
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>
                                                Vídeo {i + 1}
                                            </Typography>
                                        </Box>
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

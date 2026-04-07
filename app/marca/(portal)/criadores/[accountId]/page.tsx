'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Avatar,
    Button,
    Chip,
    CircularProgress,
    Alert,
    alpha,
    useTheme,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Instagram as InstagramIcon,
    YouTube as YouTubeIcon,
    OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { normalizeInstagramHandle, normalizeTikTokHandle } from '@/lib/normalize-social-handles';

interface CreatorDetail {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    link_instagram?: string;
    link_tiktok?: string;
    link_youtube?: string;
    category?: string;
    niches?: string[];
    address_country?: string;
    address_state?: string;
    address_city?: string;
    cached_followers_total?: number;
    followers_at_signup?: number;
    cached_followers_updated_at?: string;
    cached_engagement_score?: number;
    cached_total_views?: number;
    link_media_kit?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    ugc: 'UGC Creator',
    influencer: 'Influencer',
    ambos: 'UGC + Influencer',
};

function formatFollowers(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function engagementLevel(score: number): { label: string; color: 'error' | 'warning' | 'info' | 'success' } {
    if (score <= 30) return { label: 'Baixo', color: 'error' };
    if (score <= 60) return { label: 'Médio', color: 'warning' };
    if (score <= 80) return { label: 'Bom', color: 'info' };
    return { label: 'Excelente', color: 'success' };
}

export default function MarcaCreatorDetailPage() {
    const theme = useTheme();
    const params = useParams();
    const accountId = typeof params?.accountId === 'string' ? params.accountId : '';

    const [creator, setCreator] = useState<CreatorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!accountId) return;
        setLoading(true);
        setError('');
        fetch(`/api/marca/creators/${accountId}`)
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok) {
                    setError(data.error || 'Não foi possível carregar o creator.');
                    setCreator(null);
                    return;
                }
                setCreator(data.creator);
            })
            .catch(() => {
                setError('Erro de rede.');
                setCreator(null);
            })
            .finally(() => setLoading(false));
    }, [accountId]);

    const fullName = creator ? `${creator.first_name} ${creator.last_name}`.trim() : '';
    const followers =
        typeof creator?.cached_followers_total === 'number'
            ? creator.cached_followers_total
            : typeof creator?.followers_at_signup === 'number'
              ? creator.followers_at_signup
              : null;
    const igHandle = creator?.link_instagram ? normalizeInstagramHandle(creator.link_instagram) : null;
    const ttHandle = creator?.link_tiktok ? normalizeTikTokHandle(creator.link_tiktok) : null;

    return (
        <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            <Button
                component={Link}
                href="/marca/criadores"
                startIcon={<ArrowBackIcon />}
                sx={{ textTransform: 'none', fontWeight: 600, mb: 2 }}
            >
                Voltar aos criadores
            </Button>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!loading && creator && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
                        <Avatar
                            src={creator.avatar_url || undefined}
                            sx={{
                                width: 88,
                                height: 88,
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                                color: 'primary.main',
                                fontWeight: 800,
                                fontSize: 32,
                            }}
                        >
                            {fullName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h5" fontWeight={800}>
                                {fullName}
                            </Typography>
                            {creator.category && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {CATEGORY_LABELS[creator.category] || creator.category}
                                </Typography>
                            )}
                            {(creator.address_city || creator.address_state || creator.address_country) && (
                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                                    {[creator.address_city, creator.address_state, creator.address_country].filter(Boolean).join(', ')}
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {followers != null && (
                            <Chip label={`${formatFollowers(followers)} seguidores`} variant="outlined" sx={{ fontWeight: 600 }} />
                        )}
                        {typeof creator.cached_engagement_score === 'number' && (
                            <Chip
                                label={`Engajamento ${creator.cached_engagement_score}/100 · ${engagementLevel(creator.cached_engagement_score).label}`}
                                color={engagementLevel(creator.cached_engagement_score).color}
                                sx={{ fontWeight: 600 }}
                            />
                        )}
                        {typeof creator.cached_total_views === 'number' && creator.cached_total_views > 0 && (
                            <Chip label={`~${formatFollowers(creator.cached_total_views)} views`} variant="outlined" sx={{ fontWeight: 600 }} />
                        )}
                    </Stack>

                    {creator.cached_followers_updated_at && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
                            Métricas de seguidores atualizadas em{' '}
                            {new Date(creator.cached_followers_updated_at).toLocaleDateString('pt-BR')}
                        </Typography>
                    )}

                    {creator.niches && creator.niches.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                                Nichos
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                {creator.niches.map((n) => (
                                    <Chip key={n} size="small" label={n} />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Redes
                    </Typography>
                    <Stack spacing={1}>
                        {creator.link_instagram && igHandle && (
                            <Button
                                component="a"
                                href={`https://instagram.com/${igHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<InstagramIcon />}
                                endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                            >
                                @{igHandle}
                            </Button>
                        )}
                        {creator.link_tiktok && ttHandle && (
                            <Button
                                component="a"
                                href={`https://www.tiktok.com/@${ttHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                            >
                                TikTok @{ttHandle}
                            </Button>
                        )}
                        {creator.link_youtube && (
                            <Button
                                component="a"
                                href={creator.link_youtube.startsWith('http') ? creator.link_youtube : `https://${creator.link_youtube}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<YouTubeIcon />}
                                endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                            >
                                YouTube
                            </Button>
                        )}
                    </Stack>

                    {creator.link_media_kit && (
                        <Button
                            component="a"
                            href={creator.link_media_kit}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            fullWidth
                            sx={{ mt: 3, textTransform: 'none', fontWeight: 700 }}
                        >
                            Ver media kit
                        </Button>
                    )}
                </Paper>
            )}
        </Box>
    );
}

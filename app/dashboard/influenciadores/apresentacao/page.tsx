'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Grid,
    Card,
    CardActionArea,
    Avatar,
    CircularProgress,
    Chip,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Slideshow as SlideshowIcon,
    People as PeopleIcon,
    Favorite as FavoriteIcon,
} from '@mui/icons-material';

interface ApresentacaoCreator {
    _id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    link_instagram: string | null;
    link_tiktok: string | null;
    followers: number | null;
    engagementScore: number | null;
    category: string | null;
}

interface ApresentacaoStats {
    totalCreators: number;
    totalFollowers: number;
    followersUpdatedAt: string | null;
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

function getEngagementLevel(score: number): { label: string; color: 'error' | 'warning' | 'info' | 'success' } {
    if (score <= 30) return { label: 'Baixo', color: 'error' };
    if (score <= 60) return { label: 'Médio', color: 'warning' };
    if (score <= 80) return { label: 'Bom', color: 'info' };
    return { label: 'Excelente', color: 'success' };
}

export default function ApresentacaoPage() {
    const theme = useTheme();
    const [creators, setCreators] = useState<ApresentacaoCreator[]>([]);
    const [stats, setStats] = useState<ApresentacaoStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/influencers/apresentacao')
            .then((r) => r.json())
            .then((data) => {
                setCreators(data.creators || []);
                setStats(data.stats || null);
            })
            .catch(() => {
                setCreators([]);
                setStats(null);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <SlideshowIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700}>
                    Apresentação
                </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Portfólio para mostrar às marcas: nossos top creators e métricas da comunidade.
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Métricas gerais */}
                    {stats && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <PeopleIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                        {stats.totalCreators.toLocaleString('pt-BR')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Creators na Dome
                                    </Typography>
                                </Box>
                            </Paper>
                            <Paper
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <FavoriteIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                        {formatFollowers(stats.totalFollowers)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Seguidores atuais
                                    </Typography>
                                    {stats.followersUpdatedAt && (
                                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                                            Atualizado em {new Date(stats.followersUpdatedAt).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Stack>
                    )}

                    {/* Top creators */}
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                        Top creators
                    </Typography>
                    <Grid container spacing={2}>
                        {creators.map((c) => {
                            const fullName = `${c.first_name} ${c.last_name}`.trim();
                            const handle = c.link_instagram
                                ? `@${c.link_instagram.replace('@', '')}`
                                : c.link_tiktok
                                    ? `@${c.link_tiktok.replace('@', '')}`
                                    : null;
                            return (
                                <Grid key={c._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Card
                                        component={Link}
                                        href={`/dashboard/influenciadores/${c._id}`}
                                        elevation={0}
                                        sx={{
                                            textDecoration: 'none',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            height: '100%',
                                        }}
                                    >
                                        <CardActionArea sx={{ p: 2, height: '100%' }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar
                                                    src={c.avatar_url || undefined}
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                        color: 'primary.main',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {fullName.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                        {fullName}
                                                    </Typography>
                                                    {handle && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {handle}
                                                        </Typography>
                                                    )}
                                                    {c.category && (
                                                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                                                            {CATEGORY_LABELS[c.category] || c.category}
                                                        </Typography>
                                                    )}
                                                    {c.followers != null && (
                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.25 }}>
                                                            {formatFollowers(c.followers)} seguidores
                                                        </Typography>
                                                    )}
                                                    <Box sx={{ mt: 0.75 }}>
                                                        {c.engagementScore != null ? (
                                                            <Chip
                                                                size="small"
                                                                label={`${c.engagementScore}/100 · ${getEngagementLevel(c.engagementScore).label}`}
                                                                color={getEngagementLevel(c.engagementScore).color}
                                                                sx={{ fontSize: '0.7rem', height: 20, fontWeight: 600 }}
                                                            />
                                                        ) : (
                                                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                                Engajamento: atualizado 1x ao dia
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    {creators.length === 0 && !loading && (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Nenhum creator no portfólio.
                            </Typography>
                        </Paper>
                    )}
                </>
            )}
        </Box>
    );
}

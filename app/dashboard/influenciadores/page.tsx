'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Paper,
    Stack,
    TextField,
    InputAdornment,
    CircularProgress,
    Avatar,
    Card,
    CardActionArea,
    Chip,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { normalizeInstagramHandle, normalizeTikTokHandle } from '@/lib/normalize-social-handles';

interface TopUser {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
    engagementScore: number | null;
    instagramProfile?: string;
    tiktokProfile?: string;
}

interface InfluencerListItem {
    _id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    link_instagram: string | null;
    link_tiktok: string | null;
    followers_at_signup: number | null;
    created_at: string | null;
    is_founding_member?: boolean;
    category?: string | null;
}

function formatFollowers(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

export default function InfluenciadoresDashboardPage() {
    const theme = useTheme();
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [topLoading, setTopLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [influencers, setInfluencers] = useState<InfluencerListItem[]>([]);
    const [listLoading, setListLoading] = useState(true);

    useEffect(() => {
        let t: ReturnType<typeof setTimeout> | null = null;
        if (searchQuery.trim() !== debouncedQuery) {
            t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
        }
        return () => { if (t) clearTimeout(t); };
    }, [searchQuery, debouncedQuery]);

    useEffect(() => {
        let cancelled = false;
        setTopLoading(true);
        fetch('/api/admin/influencers/top-engagement')
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                setTopUsers(data.users || []);
            })
            .catch(() => { if (!cancelled) setTopUsers([]); })
            .finally(() => { if (!cancelled) setTopLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setListLoading(true);
        const params = new URLSearchParams();
        if (debouncedQuery) params.set('q', debouncedQuery);
        fetch(`/api/admin/influencers?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                setInfluencers(data.influencers || []);
            })
            .catch(() => { if (!cancelled) setInfluencers([]); })
            .finally(() => { if (!cancelled) setListLoading(false); });
    }, [debouncedQuery]);

    return (
        <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PersonIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700}>
                    Influenciadores
                </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Top engajamento nas redes sociais (Instagram/TikTok) e busca por nome ou @ do Instagram.
            </Typography>

            {/* Top 3 engajamento nas redes */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Top 3 destaques de engajamento (redes sociais)
            </Typography>
            {topLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                </Box>
            ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                    {topUsers.map((user, idx) => (
                        <Card
                            key={user.id}
                            component={Link}
                            href={`/dashboard/influenciadores/${user.id}`}
                            elevation={0}
                            sx={{
                                flex: 1,
                                textDecoration: 'none',
                                border: '1px solid',
                                borderColor: idx === 0 ? 'warning.main' : 'divider',
                                borderRadius: 2,
                                bgcolor: idx === 0 ? alpha(theme.palette.warning.main, 0.06) : 'background.paper',
                            }}
                        >
                            <CardActionArea sx={{ p: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                        }}
                                    >
                                        #{idx + 1}
                                    </Box>
                                    <Avatar
                                        src={user.avatar || undefined}
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                                            color: 'primary.main',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {user.initials}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                                            {user.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {user.engagementScore != null
                                                ? `Engajamento ${user.engagementScore}/100`
                                                : 'Engajamento: atualizado 1x ao dia'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardActionArea>
                        </Card>
                    ))}
                    {topUsers.length === 0 && !topLoading && (
                        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Nenhum destaque esta semana.
                            </Typography>
                        </Paper>
                    )}
                </Stack>
            )}

            {/* Busca */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Buscar por nome ou @ do Instagram
            </Typography>
            <TextField
                fullWidth
                size="small"
                placeholder="Nome ou @instagram"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
            />

            {/* Lista */}
            {listLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                </Box>
            ) : (
                <Stack spacing={1}>
                    {influencers.map((inf) => {
                        const fullName = `${inf.first_name} ${inf.last_name}`.trim();
                        const igHandle = inf.link_instagram ? normalizeInstagramHandle(inf.link_instagram) : null;
                        const ttHandle = inf.link_tiktok ? normalizeTikTokHandle(inf.link_tiktok) : null;
                        const handle = igHandle ? `@${igHandle}` : ttHandle ? `@${ttHandle}` : null;
                        return (
                            <Card
                                key={inf._id}
                                component={Link}
                                href={`/dashboard/influenciadores/${inf._id}`}
                                elevation={0}
                                sx={{
                                    textDecoration: 'none',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                }}
                            >
                                <CardActionArea sx={{ px: 2, py: 1.5 }}>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Avatar
                                            src={inf.avatar_url || undefined}
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                color: 'primary.main',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {fullName.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                                {fullName}
                                            </Typography>
                                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                {handle && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {handle}
                                                    </Typography>
                                                )}
                                                {inf.followers_at_signup != null && (
                                                    <Typography variant="caption" color="text.disabled">
                                                        {formatFollowers(inf.followers_at_signup)} seguidores na entrada
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                        {inf.is_founding_member && (
                                            <Chip label="Fundador" size="small" color="primary" sx={{ fontSize: '0.7rem' }} />
                                        )}
                                    </Stack>
                                </CardActionArea>
                            </Card>
                        );
                    })}
                    {influencers.length === 0 && !listLoading && (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {debouncedQuery ? 'Nenhum resultado para essa busca.' : 'Nenhum influenciador encontrado.'}
                            </Typography>
                        </Paper>
                    )}
                </Stack>
            )}
        </Box>
    );
}

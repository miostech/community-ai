'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Skeleton,
    Avatar,
    Fab,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Add as AddIcon,
    FiberManualRecord as DotIcon,
    CalendarToday as CalendarIcon,
    Visibility as ViewersIcon,
    PlayCircleOutline as PlayIcon,
    Delete as DeleteIcon,
    Notifications as NotificationsIcon,
    Share as ShareIcon,
} from '@mui/icons-material';

interface LiveEventCreator {
    _id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    role?: string;
}

interface LiveEvent {
    _id: string;
    title: string;
    description?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    scheduled_at?: string;
    started_at?: string;
    ended_at?: string;
    viewer_count: number;
    max_viewer_count: number;
    creator: LiveEventCreator | null;
    recording_url?: string;
    members_only?: boolean;
    slug?: string;
    created_at: string;
}

const CREATOR_ROLES = ['moderator', 'admin', 'criador'];

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function creatorName(creator: LiveEventCreator | null): string {
    if (!creator) return 'Desconhecido';
    return [creator.first_name, creator.last_name].filter(Boolean).join(' ').trim() || 'Desconhecido';
}

export default function LivesPage() {
    const { account } = useAccount();
    const router = useRouter();
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const canCreate = CREATOR_ROLES.includes(account?.role || '');

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch('/api/lives?limit=100');
            if (!res.ok) return;
            const data = await res.json();
            setEvents(data.events || []);
        } catch (err) {
            console.error('[lives]', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const liveNow = events.filter((e) => e.status === 'live');
    const scheduled = events.filter((e) => e.status === 'scheduled');
    const ended = events.filter((e) => e.status === 'ended');

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    width: { md: 'calc(100% - 256px)' },
                    ml: { md: '256px' },
                    display: { xs: 'none', md: 'block' },
                }}
            >
                <Toolbar>
                    <VideocamIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, flexGrow: 1 }}>
                        Lives
                    </Typography>
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => router.push('/dashboard/lives/criar')}
                            size="small"
                        >
                            Criar Live
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ display: { xs: 'block', md: 'none' }, pt: 1, px: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Lives
                </Typography>
            </Box>

            <Box sx={{ maxWidth: 960, mx: 'auto', pt: { xs: 1, md: 10 }, pb: { xs: 12, sm: 4 } }}>
                {loading ? (
                    <Stack spacing={2} sx={{ px: 2 }}>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} variant="rounded" height={120} />
                        ))}
                    </Stack>
                ) : (
                    <>
                        {liveNow.length > 0 && (
                            <Section title="Ao Vivo Agora" events={liveNow} router={router} accountId={account?.id} accountRole={account?.role} onRefresh={fetchEvents} />
                        )}
                        {scheduled.length > 0 && (
                            <Section title="Agendadas" events={scheduled} router={router} accountId={account?.id} accountRole={account?.role} onRefresh={fetchEvents} />
                        )}
                        {ended.length > 0 && (
                            <Section title="Encerradas" events={ended} router={router} accountId={account?.id} accountRole={account?.role} onRefresh={fetchEvents} />
                        )}
                        {events.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <VideocamIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    Nenhuma live agendada
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Quando um moderador criar uma live, ela aparecerá aqui.
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {canCreate && (
                <Fab
                    color="primary"
                    onClick={() => router.push('/dashboard/lives/criar')}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 80, md: 24 },
                        right: 24,
                        display: { xs: 'flex', md: 'none' },
                    }}
                >
                    <AddIcon />
                </Fab>
            )}
        </>
    );
}

function Section({
    title,
    events,
    router,
    accountId,
    accountRole,
    onRefresh,
}: {
    title: string;
    events: LiveEvent[];
    router: ReturnType<typeof useRouter>;
    accountId?: string;
    accountRole?: string;
    onRefresh: () => void;
}) {
    return (
        <Box sx={{ mb: 4, px: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                {title}
            </Typography>
            <Stack spacing={2}>
                {events.map((event) => (
                    <LiveEventCard
                        key={event._id}
                        event={event}
                        onClick={() => router.push(`/dashboard/lives/${event._id}`)}
                        canDelete={accountRole === 'admin' || event.creator?._id === accountId}
                        onRefresh={onRefresh}
                    />
                ))}
            </Stack>
        </Box>
    );
}

function LiveEventCard({ event, onClick, canDelete, onRefresh }: { event: LiveEvent; onClick: () => void; canDelete?: boolean; onRefresh: () => void }) {
    const isLive = event.status === 'live';
    const isEnded = event.status === 'ended';

    return (
        <Card variant="outlined" sx={{ borderRadius: 2, opacity: isEnded ? 0.7 : 1 }}>
            <CardActionArea onClick={onClick} sx={{ p: 2 }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                            src={event.creator?.avatar_url || undefined}
                            sx={{ width: 48, height: 48 }}
                        >
                            {creatorName(event.creator).charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
                                    {event.title}
                                </Typography>
                                {event.members_only && (
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Box component="img" src="/images/cursos/premium-account.png" alt="" sx={{ width: 16, height: 16 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.7rem' }}>
                                            Premium
                                        </Typography>
                                    </Stack>
                                )}
                                {isLive && (
                                    <Chip
                                        icon={<DotIcon sx={{ fontSize: 10, animation: 'pulse 1.5s infinite' }} />}
                                        label="AO VIVO"
                                        size="small"
                                        color="error"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                            height: 22,
                                            '@keyframes pulse': {
                                                '0%, 100%': { opacity: 1 },
                                                '50%': { opacity: 0.3 },
                                            },
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {creatorName(event.creator)}
                            </Typography>
                            {event.description && (
                                <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                                    {event.description}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {isLive && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ViewersIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {event.viewer_count} assistindo
                                        </Typography>
                                    </Box>
                                )}
                                {event.status === 'scheduled' && event.scheduled_at && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(event.scheduled_at)}
                                        </Typography>
                                    </Box>
                                )}
                                {isEnded && event.ended_at && (
                                    <Typography variant="caption" color="text.secondary">
                                        Encerrada em {formatDate(event.ended_at)} · {event.max_viewer_count} visualizações
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        {isLive && (
                            <Chip
                                label="Assistir"
                                color="error"
                                size="small"
                                sx={{ flexShrink: 0, alignSelf: 'center', fontWeight: 600 }}
                            />
                        )}
                        {event.status === 'scheduled' && event.scheduled_at && (
                            <Chip
                                icon={<CalendarIcon sx={{ fontSize: 14 }} />}
                                label={`Inicia ${formatDate(event.scheduled_at)}`}
                                variant="outlined"
                                size="small"
                                sx={{ flexShrink: 0, alignSelf: 'center', fontWeight: 600 }}
                            />
                        )}
                        {isEnded && event.recording_url && (
                            <Chip
                                icon={<PlayIcon sx={{ fontSize: 16 }} />}
                                label="Gravação"
                                color="primary"
                                size="small"
                                sx={{ flexShrink: 0, alignSelf: 'center', fontWeight: 600 }}
                            />
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
            {event.slug && !canDelete && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pb: 1 }}>
                    <Tooltip title="Compartilhar">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                const url = `${window.location.origin}/live/${event.slug}`;
                                navigator.clipboard.writeText(url).then(() => alert('Link copiado!')).catch(() => prompt('Copie o link:', url));
                            }}
                        >
                            <ShareIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            {canDelete && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, px: 1, pb: 1 }}>
                    {event.slug && (
                        <Tooltip title="Compartilhar">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/live/${event.slug}`;
                                    navigator.clipboard.writeText(url).then(() => alert('Link copiado!')).catch(() => prompt('Copie o link:', url));
                                }}
                            >
                                <ShareIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {!isEnded && (
                        <Tooltip title="Notificar todos os usuários sobre esta live">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('Enviar notificação sobre esta live para todos os usuários?')) return;
                                    try {
                                        const res = await fetch(`/api/lives/${event._id}/notify`, { method: 'POST' });
                                        if (res.ok) {
                                            const data = await res.json();
                                            alert(`Notificação enviada para ${data.notified} usuários!`);
                                        } else {
                                            alert('Erro ao enviar notificação.');
                                        }
                                    } catch {
                                        alert('Erro ao enviar notificação.');
                                    }
                                }}
                            >
                                <NotificationsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Excluir live">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm('Tem certeza que deseja excluir esta live?')) return;
                                try {
                                    await fetch(`/api/lives/${event._id}`, { method: 'DELETE' });
                                    onRefresh();
                                } catch {}
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
        </Card>
    );
}

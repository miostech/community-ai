'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import {
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Avatar,
    Chip,
    TextField,
    Paper,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Videocam as VideocamIcon,
    VideocamOff as VideocamOffIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    ScreenShare as ScreenShareIcon,
    StopScreenShare as StopScreenShareIcon,
    CallEnd as CallEndIcon,
    Send as SendIcon,
    FiberManualRecord as DotIcon,
    PanTool as HandIcon,
    People as PeopleIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Share as ShareIcon,
    Fullscreen as FullscreenIcon,
    PushPin as PushPinIcon,
} from '@mui/icons-material';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useRoomContext,
    useParticipants,
    useTracks,
    useDataChannel,
    VideoTrack,
    AudioTrack,
} from '@livekit/components-react';
import { Track, RoomEvent, DataPacket_Kind } from 'livekit-client';
import type { RemoteParticipant } from 'livekit-client';

const MAX_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas

interface LiveEventData {
    _id: string;
    title: string;
    slug?: string;
    description?: string;
    cover_image_url?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    started_at?: string;
    creator: {
        _id: string;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
    } | null;
    viewer_count: number;
    room_name: string;
    promoted_speakers?: string[];
    recording_url?: string;
}

interface ChatMessage {
    id: string;
    sender: string;
    senderName: string;
    message: string;
    timestamp: number;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function getShareUrl(slug?: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return slug ? `${origin}/live/${slug}` : '';
}

async function shareOrCopyLink(slug?: string, title?: string) {
    const url = getShareUrl(slug);
    if (!url) return;
    if (navigator.share) {
        try {
            await navigator.share({ title: title || 'Live na Dome', url });
            return;
        } catch {}
    }
    try {
        await navigator.clipboard.writeText(url);
        alert('Link copiado!');
    } catch {
        prompt('Copie o link:', url);
    }
}

export default function LiveRoomPage() {
    const { liveId } = useParams<{ liveId: string }>();
    const router = useRouter();
    const { account } = useAccount();

    const [event, setEvent] = useState<LiveEventData | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showJoinChoice, setShowJoinChoice] = useState(false);
    const [waitingReconnect, setWaitingReconnect] = useState(false);
    const intentionalLeaveRef = useRef(false);

    const isStaff = account?.role === 'moderator' || account?.role === 'admin' || account?.role === 'criador';

    const fetchEvent = useCallback(async () => {
        try {
            const res = await fetch(`/api/lives/${liveId}`);
            if (!res.ok) {
                setError('Live não encontrada');
                return;
            }
            const data = await res.json();
            setEvent(data.event);
            return data.event as LiveEventData;
        } catch {
            setError('Erro ao carregar live');
            return null;
        }
    }, [liveId]);

    const [membersOnly, setMembersOnly] = useState(false);

    const fetchToken = useCallback(async (joinAsViewer = false) => {
        try {
            const res = await fetch(`/api/lives/${liveId}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ joinAsViewer }),
            });
            if (!res.ok) {
                const data = await res.json();
                if (data.error === 'members_only') {
                    setMembersOnly(true);
                    return;
                }
                setError(data.error || 'Erro ao entrar na live');
                return;
            }
            const data = await res.json();
            setToken(data.token);
            setLivekitUrl(data.livekit_url);
            setIsHost(data.is_host);
            setIsSpeaker(data.is_speaker);
        } catch {
            setError('Erro ao conectar na live');
        } finally {
            setLoading(false);
        }
    }, [liveId]);

    useEffect(() => {
        fetchEvent().then((ev) => {
            if (!ev) return;
            if (ev.status === 'ended' || ev.status === 'cancelled') {
                setLoading(false);
                return;
            }
            const isCreator = account?.id === ev.creator?._id;
            if (isStaff && !isCreator) {
                setShowJoinChoice(true);
                setLoading(false);
            } else {
                fetchToken();
            }
        });
    }, [fetchEvent, fetchToken, account?.id, isStaff]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 2, px: 2 }}>
                <Typography color="error" textAlign="center">{error}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={() => router.push('/dashboard/lives')}>
                        Voltar
                    </Button>
                    <Button variant="contained" onClick={() => window.location.reload()}>
                        Tentar novamente
                    </Button>
                </Box>
            </Box>
        );
    }

    if (showJoinChoice && event) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 3, px: 2 }}>
                <Typography variant="h5" fontWeight={700} textAlign="center">
                    {event.title}
                </Typography>
                <Typography color="text.secondary" textAlign="center">
                    Como você quer entrar na live?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<VideocamIcon />}
                        onClick={() => {
                            setShowJoinChoice(false);
                            setLoading(true);
                            fetchToken(false);
                        }}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        Entrar ao vivo
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => {
                            setShowJoinChoice(false);
                            setLoading(true);
                            fetchToken(true);
                        }}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        Apenas assistir
                    </Button>
                </Box>
                <Button variant="text" onClick={() => router.push('/dashboard/lives')}>
                    Voltar
                </Button>
            </Box>
        );
    }

    if (membersOnly && event) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 3, px: 2 }}>
                {event.cover_image_url ? (
                    <Box
                        component="img"
                        src={event.cover_image_url}
                        alt={event.title}
                        sx={{ width: '100%', maxWidth: 500, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 2, opacity: 0.7 }}
                    />
                ) : (
                    <Box component="img" src="/images/cursos/premium-account.png" alt="" sx={{ width: 80, height: 80 }} />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="img" src="/images/cursos/premium-account.png" alt="" sx={{ width: 20, height: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        Exclusiva para Premium
                    </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {event.title}
                </Typography>
                <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 450 }}>
                    Esta live é exclusiva para membros Premium. Faça upgrade para assistir e participar de conteúdos exclusivos.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/dashboard/assinatura')}
                    sx={{
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        fontWeight: 600,
                        '&:hover': { background: 'linear-gradient(135deg, #d97706, #ea580c)' },
                    }}
                >
                    Fazer upgrade
                </Button>
                <Button variant="text" onClick={() => router.push('/dashboard/lives')}>
                    Voltar
                </Button>
            </Box>
        );
    }

    if (event && (event.status === 'ended' || event.status === 'cancelled')) {
        const canReopen = account?.id === event.creator?._id || isStaff;
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: { xs: 2, md: 8 }, pb: 4, px: 2, gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{event.title}</Typography>
                {event.recording_url ? (
                    <Box sx={{ width: '100%', maxWidth: 800 }}>
                        <Box
                            component="video"
                            controls
                            sx={{ width: '100%', borderRadius: 2, bgcolor: 'black' }}
                            src={event.recording_url}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                            Gravação da live
                        </Typography>
                    </Box>
                ) : (
                    <Typography color="text.secondary">Esta live já foi encerrada</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={() => router.push('/dashboard/lives')}>
                        Voltar para Lives
                    </Button>
                    {canReopen && (
                        <Button
                            variant="contained"
                            startIcon={<VideocamIcon />}
                            onClick={async () => {
                                try {
                                    const res = await fetch(`/api/lives/${liveId}/reopen`, { method: 'POST' });
                                    if (!res.ok) {
                                        const data = await res.json();
                                        alert(data.error || 'Erro ao reabrir');
                                        return;
                                    }
                                    window.location.reload();
                                } catch {
                                    alert('Erro ao reabrir a live');
                                }
                            }}
                        >
                            Reabrir live
                        </Button>
                    )}
                </Box>
            </Box>
        );
    }

    if (!token || !livekitUrl || !event) return null;

    if (event.status === 'scheduled' && isHost) {
        return (
            <PreLiveView
                event={event}
                liveId={liveId}
                onStarted={() => {
                    setEvent((prev) => prev ? { ...prev, status: 'live' } : prev);
                }}
                onBack={() => router.push('/dashboard/lives')}
            />
        );
    }

    if (event.status === 'scheduled' && !isHost) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: { xs: '80dvh', md: '80vh' }, px: 2, pt: { xs: 'max(16px, env(safe-area-inset-top))', md: 0 }, gap: 2 }}>
                {event.cover_image_url ? (
                    <Box
                        component="img"
                        src={event.cover_image_url}
                        alt={event.title}
                        sx={{ width: '100%', maxWidth: { xs: '100%', sm: 500 }, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 2 }}
                    />
                ) : (
                    <VideocamIcon sx={{ fontSize: { xs: 48, md: 64 }, color: 'text.disabled' }} />
                )}
                <Typography variant="h6" sx={{ textAlign: 'center' }}>{event.title}</Typography>
                <Typography color="text.secondary" sx={{ textAlign: 'center' }}>A live ainda não começou. Aguarde o host iniciar.</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button variant="outlined" onClick={() => router.push('/dashboard/lives')}>
                        Voltar
                    </Button>
                    {event.slug && (
                        <Tooltip title="Copiar link de compartilhamento">
                            <IconButton onClick={() => shareOrCopyLink(event.slug, event.title)} sx={{ border: 1, borderColor: 'divider' }}>
                                <ShareIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        );
    }

    const handleReconnect = async () => {
        setWaitingReconnect(false);
        setToken(null);
        setLoading(true);
        await fetchEvent();
        await fetchToken();
    };

    const handleLeaveForReconnect = () => {
        intentionalLeaveRef.current = true;
        setToken(null);
        setWaitingReconnect(true);
    };

    if (waitingReconnect && event) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 3, px: 2 }}>
                <VideocamOffIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6" fontWeight={700} textAlign="center">
                    Você saiu da live
                </Typography>
                <Typography color="text.secondary" textAlign="center">
                    A live continua ativa. Reconecte quando estiver pronta.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} /> : <VideocamIcon />}
                        onClick={handleReconnect}
                        disabled={loading}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        Reconectar
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => router.push('/dashboard/lives')}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        Voltar para Lives
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={livekitUrl}
            token={token}
            connect={true}
            onError={(err) => {
                console.error('[LiveKit]', err);
                const msg = err?.message || '';
                if (msg.includes('room not found') || msg.includes('404')) {
                    setError('A sala da live ainda não foi criada. O host precisa iniciar a live primeiro.');
                } else if (msg.includes('participant') || msg.includes('max')) {
                    setError('A live atingiu o limite de participantes simultâneos.');
                } else if (msg.includes('token') || msg.includes('expired') || msg.includes('401')) {
                    setError('Seu acesso expirou. Recarregue a página para tentar novamente.');
                } else {
                    setError(`Não foi possível conectar na live. Tente recarregar a página. (${msg || 'erro desconhecido'})`);
                }
            }}
            onDisconnected={() => {
                if (intentionalLeaveRef.current) {
                    intentionalLeaveRef.current = false;
                    return;
                }
                router.push('/dashboard/lives');
            }}
            style={{ height: '100%' }}
        >
            <RoomContent
                event={event}
                isHost={isHost}
                isCreator={account?.id === event.creator?._id}
                isSpeaker={isSpeaker}
                liveId={liveId}
                accountId={account?.id || ''}
                isStaff={isStaff}
                onEnd={() => router.push('/dashboard/lives')}
                onLeaveReconnect={handleLeaveForReconnect}
            />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}

function PreLiveView({
    event,
    liveId,
    onStarted,
    onBack,
}: {
    event: LiveEventData;
    liveId: string;
    onStarted: () => void;
    onBack: () => void;
}) {
    const [starting, setStarting] = useState(false);

    const handleStart = async () => {
        setStarting(true);
        try {
            const res = await fetch(`/api/lives/${liveId}/start`, { method: 'POST' });
            if (res.ok) {
                onStarted();
            }
        } finally {
            setStarting(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: { xs: '80dvh', md: '80vh' }, px: 2, pt: { xs: 'max(16px, env(safe-area-inset-top))', md: 0 }, gap: 3 }}>
            {event.cover_image_url ? (
                <Box
                    component="img"
                    src={event.cover_image_url}
                    alt={event.title}
                    sx={{ width: '100%', maxWidth: { xs: '100%', sm: 600 }, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 2 }}
                />
            ) : (
                <VideocamIcon sx={{ fontSize: { xs: 56, md: 80 }, color: 'primary.main' }} />
            )}
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                {event.title}
            </Typography>
            {event.description && (
                <Typography color="text.secondary" sx={{ maxWidth: 500, textAlign: 'center' }}>
                    {event.description}
                </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={handleStart}
                    disabled={starting}
                    startIcon={starting ? <CircularProgress size={20} /> : <VideocamIcon />}
                >
                    {starting ? 'Iniciando...' : 'Iniciar Live'}
                </Button>
                {event.slug && (
                    <Tooltip title="Copiar link de compartilhamento">
                        <IconButton onClick={() => shareOrCopyLink(event.slug, event.title)} sx={{ border: 1, borderColor: 'divider' }}>
                            <ShareIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Button variant="text" onClick={onBack}>
                Voltar
            </Button>
        </Box>
    );
}

function RoomContent({
    event,
    isHost,
    isCreator,
    isSpeaker,
    liveId,
    accountId,
    isStaff,
    onEnd,
    onLeaveReconnect,
}: {
    event: LiveEventData;
    isHost: boolean;
    isCreator: boolean;
    isSpeaker: boolean;
    liveId: string;
    accountId: string;
    isStaff: boolean;
    onEnd: () => void;
    onLeaveReconnect: () => void;
}) {
    const room = useRoomContext();
    const participants = useParticipants();
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone]);

    const [cameraOn, setCameraOn] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [screenOn, setScreenOn] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [handRaised, setHandRaised] = useState(false);
    const [handRequests, setHandRequests] = useState<{ id: string; name: string }[]>([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [promotedSpeakers, setPromotedSpeakers] = useState<string[]>(event.promoted_speakers || []);
    const [ending, setEnding] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [timeWarning, setTimeWarning] = useState(false);
    const [highlightedComment, setHighlightedComment] = useState<ChatMessage | null>(null);
    const [pinnedComment, setPinnedComment] = useState<ChatMessage | null>(null);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [joinToasts, setJoinToasts] = useState<{ id: string; name: string }[]>([]);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const videoGridRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    const canPublishAudio = isHost || isSpeaker || isStaff;
    const canHighlight = isHost || isCreator || isStaff;

    useEffect(() => {
        fetch(`/api/lives/${liveId}/chat`)
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data?.messages?.length) {
                    const history: ChatMessage[] = data.messages.map((m: { sender: string; senderName: string; message: string; timestamp: number }) => ({
                        id: `${m.timestamp}-${m.sender}`,
                        sender: m.sender,
                        senderName: m.sender === accountId ? 'Eu' : m.senderName,
                        message: m.message,
                        timestamp: m.timestamp,
                    }));
                    setChatMessages(history);
                    setTimeout(() => {
                        chatEndRef.current?.scrollIntoView();
                    }, 100);
                }
            })
            .catch(() => {});
    }, [liveId, accountId]);

    const toggleFullscreen = () => {
        const el = videoGridRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            el.requestFullscreen().catch(() => {});
        }
    };

    // Wake Lock: manter tela ligada durante a live
    useEffect(() => {
        let wakeLock: WakeLockSentinel | null = null;
        const request = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                }
            } catch {}
        };
        request();
        const onVisibility = () => { if (document.visibilityState === 'visible') request(); };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            wakeLock?.release().catch(() => {});
        };
    }, []);

    useEffect(() => {
        const handleJoin = (participant: RemoteParticipant) => {
            const name = participant.name || participant.identity;
            const id = `${participant.identity}-${Date.now()}`;
            setJoinToasts((prev) => [...prev.slice(-4), { id, name }]);
            setTimeout(() => {
                setJoinToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        };
        room.on(RoomEvent.ParticipantConnected, handleJoin);
        return () => { room.off(RoomEvent.ParticipantConnected, handleJoin); };
    }, [room]);

    useEffect(() => {
        if (!event.started_at) return;
        const startTime = new Date(event.started_at).getTime();
        const WARNING_MS = 10 * 60 * 1000;
        const tick = () => {
            const remaining = MAX_DURATION_MS - (Date.now() - startTime);
            if (remaining <= 0) {
                if (isHost) {
                    fetch(`/api/lives/${liveId}/end`, { method: 'POST' }).finally(() => {
                        room.disconnect();
                        onEnd();
                    });
                }
                return;
            }
            setTimeWarning(remaining <= WARNING_MS);
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [event.started_at, isHost, liveId, room, onEnd]);

    const [liveCanPublishAudio, setLiveCanPublishAudio] = useState(canPublishAudio);

    useEffect(() => {
        if (isHost) {
            room.localParticipant.setCameraEnabled(true).catch(() => {});
            room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
            setCameraOn(true);
            setMicOn(true);
        } else if (isSpeaker) {
            room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
            setMicOn(true);
        }
    }, [room, isHost, isSpeaker]);

    useEffect(() => {
        const handlePermissions = () => {
            const perms = room.localParticipant.permissions;
            const sources = perms?.canPublishSources;
            const hasAudio = !sources || sources.length === 0 || sources.includes(2);
            if (hasAudio && !liveCanPublishAudio) {
                setLiveCanPublishAudio(true);
                room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
                setMicOn(true);
            } else if (!hasAudio && liveCanPublishAudio) {
                setLiveCanPublishAudio(false);
                room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
                setMicOn(false);
            }
        };
        room.on(RoomEvent.ParticipantPermissionsChanged, handlePermissions);
        return () => { room.off(RoomEvent.ParticipantPermissionsChanged, handlePermissions); };
    }, [room, liveCanPublishAudio]);

    useEffect(() => {
        const handleData = (payload: Uint8Array, participant: RemoteParticipant | undefined) => {
            try {
                const parsed = JSON.parse(TEXT_DECODER.decode(payload));
                if (parsed.type === 'chat') {
                    const msg: ChatMessage = {
                        id: `${Date.now()}-${parsed.sender}`,
                        sender: parsed.sender,
                        senderName: parsed.senderName || participant?.name || 'Anônimo',
                        message: parsed.message,
                        timestamp: Date.now(),
                    };
                    setChatMessages((prev) => [...prev.slice(-200), msg]);
                } else if (parsed.type === 'hand_raise' && (isHost || isStaff)) {
                    setHandRequests((prev) => {
                        if (prev.some((r) => r.id === parsed.sender)) return prev;
                        return [...prev, { id: parsed.sender, name: parsed.senderName || 'Participante' }];
                    });
                } else if (parsed.type === 'highlight_comment') {
                    if (parsed.comment) {
                        setHighlightedComment(parsed.comment as ChatMessage);
                        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                        highlightTimerRef.current = setTimeout(() => setHighlightedComment(null), 30000);
                    } else {
                        setHighlightedComment(null);
                        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                    }
                } else if (parsed.type === 'pin_comment') {
                    setPinnedComment(parsed.comment ? (parsed.comment as ChatMessage) : null);
                }
            } catch {}
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, isHost]);

    const checkIsAtBottom = () => {
        const el = chatContainerRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewMessages(false);
    };

    useEffect(() => {
        if (isAtBottomRef.current) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            setHasNewMessages(true);
        }
    }, [chatMessages]);

    const toggleCamera = async () => {
        const next = !cameraOn;
        await room.localParticipant.setCameraEnabled(next);
        setCameraOn(next);
    };

    const toggleMic = async () => {
        if (!liveCanPublishAudio) return;
        const next = !micOn;
        await room.localParticipant.setMicrophoneEnabled(next);
        setMicOn(next);
    };

    const toggleScreen = async () => {
        if (!isHost) return;
        const next = !screenOn;
        await room.localParticipant.setScreenShareEnabled(next);
        setScreenOn(next);
    };

    const sendChat = () => {
        if (!chatInput.trim()) return;
        const msg = chatInput.trim();
        const name = room.localParticipant.name || 'Eu';
        const payload = {
            type: 'chat',
            sender: accountId,
            senderName: name,
            message: msg,
        };
        const data = TEXT_ENCODER.encode(JSON.stringify(payload));
        room.localParticipant.publishData(data, { reliable: true });
        fetch(`/api/lives/${liveId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, senderName: name }),
        }).catch(() => {});
        setChatMessages((prev) => [
            ...prev.slice(-200),
            {
                id: `${Date.now()}-${accountId}`,
                sender: accountId,
                senderName: 'Eu',
                message: msg,
                timestamp: Date.now(),
            },
        ]);
        setChatInput('');
        isAtBottomRef.current = true;
        setHasNewMessages(false);
    };

    const raiseHand = () => {
        const payload = {
            type: 'hand_raise',
            sender: accountId,
            senderName: room.localParticipant.name || 'Participante',
        };
        const data = TEXT_ENCODER.encode(JSON.stringify(payload));
        room.localParticipant.publishData(data, { reliable: true });
        setHandRaised(true);
    };

    const highlightComment = (msg: ChatMessage) => {
        setHighlightedComment(msg);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => setHighlightedComment(null), 30000);
        const payload = {
            type: 'highlight_comment',
            comment: msg,
        };
        const data = TEXT_ENCODER.encode(JSON.stringify(payload));
        room.localParticipant.publishData(data, { reliable: true });
    };

    const dismissHighlight = () => {
        setHighlightedComment(null);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        const payload = { type: 'highlight_comment', comment: null };
        const data = TEXT_ENCODER.encode(JSON.stringify(payload));
        room.localParticipant.publishData(data, { reliable: true });
    };

    const pinComment = (msg: ChatMessage) => {
        setPinnedComment(msg);
        const payload = { type: 'pin_comment', comment: msg };
        const data = TEXT_ENCODER.encode(JSON.stringify(payload));
        room.localParticipant.publishData(data, { reliable: true });
    };

    const unpinComment = () => {
        setPinnedComment(null);
        const payload = { type: 'pin_comment', comment: null };
        const data = TEXT_ENCODER.encode(JSON.stringify(payload));
        room.localParticipant.publishData(data, { reliable: true });
    };

    const promoteParticipant = async (participantId: string) => {
        try {
            await fetch(`/api/lives/${liveId}/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: participantId }),
            });
            setHandRequests((prev) => prev.filter((r) => r.id !== participantId));
            setPromotedSpeakers((prev) => [...prev, participantId]);
        } catch {}
    };

    const demoteParticipant = async (participantId: string) => {
        try {
            await fetch(`/api/lives/${liveId}/demote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: participantId }),
            });
            setPromotedSpeakers((prev) => prev.filter((id) => id !== participantId));
        } catch {}
    };

    const handleEnd = async () => {
        setEnding(true);
        try {
            await fetch(`/api/lives/${liveId}/end`, { method: 'POST' });
            room.disconnect();
            onEnd();
        } finally {
            setEnding(false);
        }
    };

    const allVideoTracks = tracks.filter(
        (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
    );

    const isHostOrSpeaker = (identity: string) => {
        if (identity === event.creator?._id) return true;
        if (promotedSpeakers.includes(identity)) return true;
        if (identity === room.localParticipant.identity) return isHost || liveCanPublishAudio;
        const p = participants.find((pp) => pp.identity === identity);
        if (p?.metadata) {
            try {
                const meta = JSON.parse(p.metadata);
                const staffRoles = ['moderator', 'admin', 'criador'];
                if (staffRoles.includes(meta.role) && p.permissions?.canPublish) {
                    const sources = p.permissions?.canPublishSources;
                    if (!sources || sources.length === 0) return true;
                }
            } catch {}
        }
        return false;
    };

    const hostTracks = allVideoTracks.filter((t) => {
        if (t.source === Track.Source.ScreenShare) return true;
        return isHostOrSpeaker(t.participant.identity);
    });

    const viewerTracks = allVideoTracks.filter((t) => {
        if (t.source === Track.Source.ScreenShare) return false;
        return !isHostOrSpeaker(t.participant.identity);
    });

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { xs: '100dvh', md: 'calc(100vh - 64px)' }, overflow: 'hidden', position: 'relative' }}>
            {joinToasts.length > 0 && (
                <Box sx={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center', pointerEvents: 'none' }}>
                    {joinToasts.map((t) => (
                        <Paper key={t.id} elevation={3} sx={{ px: 2, py: 0.5, borderRadius: 10, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.8rem', animation: 'fadeInOut 3s ease', '@keyframes fadeInOut': { '0%': { opacity: 0, transform: 'translateY(-8px)' }, '10%': { opacity: 1, transform: 'translateY(0)' }, '80%': { opacity: 1 }, '100%': { opacity: 0 } } }}>
                            {t.name} entrou
                        </Paper>
                    ))}
                </Box>
            )}
            {/* Video area */}
            <Box sx={{ flex: { xs: '0 0 auto', md: 1 }, display: 'flex', flexDirection: 'column', minWidth: 0, maxHeight: { xs: '60dvh', md: 'none' }, overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, pt: { xs: 'max(12px, env(safe-area-inset-top))', md: 1.5 }, borderBottom: 1, borderColor: 'divider' }}>
                    <IconButton size="small" onClick={() => { room.disconnect(); onEnd(); }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Chip
                        icon={<DotIcon sx={{ fontSize: 10, animation: 'pulse 1.5s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />}
                        label="AO VIVO"
                        size="small"
                        color="error"
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                    {timeLeft && (
                        <Chip
                            label={timeLeft}
                            size="small"
                            variant={timeWarning ? 'filled' : 'outlined'}
                            color={timeWarning ? 'error' : 'default'}
                            sx={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace', ...(timeWarning && { animation: 'pulse 1.5s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } } }) }}
                        />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
                        {event.title}
                    </Typography>
                    <Chip
                        icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                        label={participants.length}
                        size="small"
                        variant="outlined"
                    />
                    {event.slug && (
                        <Tooltip title="Compartilhar">
                            <IconButton size="small" onClick={() => shareOrCopyLink(event.slug, event.title)}>
                                <ShareIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {(isHost || isStaff) && (
                        <Tooltip title="Participantes">
                            <IconButton size="small" onClick={() => setShowParticipants(true)}>
                                {handRequests.length > 0 ? (
                                    <HandIcon color="warning" />
                                ) : (
                                    <PeopleIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {timeWarning && (isHost || isStaff) && (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        px: 2,
                        py: 0.75,
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                    }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            A live será encerrada automaticamente em {timeLeft}. Finalize suas considerações!
                        </Typography>
                    </Box>
                )}

                {/* Viewer cameras strip */}
                {viewerTracks.length > 0 && (
                    <Box sx={{
                        display: 'flex',
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#111',
                        overflowX: 'auto',
                        flexShrink: 0,
                        '&::-webkit-scrollbar': { height: 4 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
                    }}>
                        {viewerTracks.map((trackRef) => (
                            <Box
                                key={trackRef.publication?.trackSid || trackRef.participant.identity}
                                sx={{
                                    position: 'relative',
                                    width: 80,
                                    height: 60,
                                    flexShrink: 0,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    bgcolor: '#1a1a1a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', px: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem', lineHeight: 1.4 }} noWrap>
                                        {trackRef.participant.name || trackRef.participant.identity}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Video grid - hosts & speakers */}
                <Box
                    ref={videoGridRef}
                    onDoubleClick={toggleFullscreen}
                    sx={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: hostTracks.length > 1 ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
                    gap: 1,
                    p: 1,
                    bgcolor: 'black',
                    minHeight: { xs: 200, md: 0 },
                    position: 'relative',
                    cursor: 'pointer',
                }}>
                    {hostTracks.length > 0 ? (
                        hostTracks.map((trackRef) => (
                            <Box key={trackRef.publication?.trackSid || trackRef.participant.identity} sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: '#1a1a1a' }}>
                                <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <Box sx={{ position: 'absolute', bottom: 8, left: 8 }}>
                                    <Chip
                                        label={trackRef.participant.name || trackRef.participant.identity}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem' }}
                                    />
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                            {isHost ? (
                                <Typography color="grey.500">Aguardando vídeo...</Typography>
                            ) : (
                                <>
                                    <VideocamOffIcon sx={{ fontSize: 40, color: 'grey.600' }} />
                                    <Typography color="grey.400" fontWeight={600}>
                                        Live em pausa
                                    </Typography>
                                    <Typography variant="caption" color="grey.600">
                                        O host saiu temporariamente. Aguarde a reconexão.
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}
                    {highlightedComment && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 48,
                                left: 16,
                                right: 16,
                                bgcolor: 'rgba(0,0,0,0.8)',
                                borderLeft: '3px solid #f59e0b',
                                borderRadius: 1,
                                px: 2,
                                py: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                animation: 'fadeInUp 0.3s ease-out',
                                '@keyframes fadeInUp': {
                                    from: { opacity: 0, transform: 'translateY(10px)' },
                                    to: { opacity: 1, transform: 'translateY(0)' },
                                },
                            }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                                    {highlightedComment.senderName}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', wordBreak: 'break-word' }}>
                                    {highlightedComment.message}
                                </Typography>
                            </Box>
                            {canHighlight && (
                                <IconButton size="small" onClick={dismissHighlight} sx={{ color: 'grey.400' }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    )}
                    <Tooltip title="Tela cheia (duplo toque)">
                        <IconButton
                            onClick={toggleFullscreen}
                            size="small"
                            sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                        >
                            <FullscreenIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 0.5, md: 1 }, p: { xs: 1, md: 1.5 }, borderTop: 1, borderColor: 'divider' }}>
                    {liveCanPublishAudio && (
                        <IconButton size="small" onClick={toggleMic} sx={{ bgcolor: micOn ? 'action.selected' : 'error.main', color: micOn ? 'text.primary' : 'white', '&:hover': { bgcolor: micOn ? 'action.hover' : 'error.dark' } }}>
                            {micOn ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                        </IconButton>
                    )}
                    <Tooltip title={cameraOn ? 'Desligar câmera' : 'Ligar câmera'}>
                        <IconButton size="small" onClick={toggleCamera} sx={{ bgcolor: cameraOn ? 'action.selected' : 'error.main', color: cameraOn ? 'text.primary' : 'white', '&:hover': { bgcolor: cameraOn ? 'action.hover' : 'error.dark' } }}>
                            {cameraOn ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                    {(isHost || isStaff) && (
                        <IconButton size="small" onClick={toggleScreen} sx={{ bgcolor: screenOn ? 'primary.main' : 'action.selected', color: screenOn ? 'white' : 'text.primary', display: { xs: 'none', sm: 'inline-flex' } }}>
                            {screenOn ? <StopScreenShareIcon fontSize="small" /> : <ScreenShareIcon fontSize="small" />}
                        </IconButton>
                    )}
                    {!liveCanPublishAudio && !handRaised && (
                        <Button
                            variant="outlined"
                            startIcon={<HandIcon />}
                            onClick={raiseHand}
                            size="small"
                        >
                            Pedir para falar
                        </Button>
                    )}
                    {!liveCanPublishAudio && handRaised && (
                        <Chip label="Mão levantada" icon={<HandIcon />} color="warning" size="small" />
                    )}
                    {(isHost || isStaff) && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={ending ? <CircularProgress size={16} /> : <CallEndIcon />}
                            onClick={handleEnd}
                            disabled={ending}
                            size="small"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.8125rem' }, px: { xs: 1.5, md: 2 } }}
                        >
                            Encerrar
                        </Button>
                    )}
                    {(isHost || isStaff) ? (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<VideocamOffIcon />}
                            onClick={() => { room.disconnect(); onLeaveReconnect(); }}
                            size="small"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.8125rem' }, px: { xs: 1.5, md: 2 } }}
                        >
                            Sair e reconectar
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<CallEndIcon />}
                            onClick={() => { room.disconnect(); onEnd(); }}
                            size="small"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.8125rem' }, px: { xs: 1.5, md: 2 } }}
                        >
                            Sair
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Chat sidebar */}
            <Paper
                elevation={0}
                sx={{
                    width: { xs: '100%', md: 320 },
                    flex: { xs: '1 1 0', md: 'none' },
                    height: { xs: 'auto', md: '100%' },
                    minHeight: { xs: 0, md: 'auto' },
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: { md: 1 },
                    borderTop: { xs: 1, md: 0 },
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Chat
                    </Typography>
                </Box>
                {pinnedComment && (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        bgcolor: 'action.selected',
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}>
                        <PushPinIcon sx={{ fontSize: 14, color: 'primary.main', transform: 'rotate(45deg)' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" component="span" sx={{ fontWeight: 700, mr: 0.5 }}>
                                {pinnedComment.senderName}:
                            </Typography>
                            <Typography variant="caption" component="span" sx={{ wordBreak: 'break-word' }}>
                                {pinnedComment.message}
                            </Typography>
                        </Box>
                        {canHighlight && (
                            <IconButton size="small" onClick={unpinComment} sx={{ p: 0.25 }}>
                                <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        )}
                    </Box>
                )}
                <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <Box
                        ref={chatContainerRef}
                        onScroll={() => {
                            const atBottom = checkIsAtBottom();
                            isAtBottomRef.current = atBottom;
                            if (atBottom) setHasNewMessages(false);
                        }}
                        sx={{ height: '100%', overflow: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}
                    >
                        {chatMessages.map((msg) => (
                            <Box
                                key={msg.id}
                                onClick={() => canHighlight && highlightComment(msg)}
                                sx={{
                                    cursor: canHighlight ? 'pointer' : 'default',
                                    px: 0.5,
                                    py: 0.25,
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 0.5,
                                    bgcolor: highlightedComment?.id === msg.id
                                        ? 'rgba(245,158,11,0.15)'
                                        : pinnedComment?.id === msg.id
                                            ? 'action.selected'
                                            : 'transparent',
                                    '&:hover': canHighlight ? { bgcolor: 'action.hover' } : {},
                                    '&:hover .pin-btn': { opacity: 1 },
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                                        {msg.senderName}:
                                    </Typography>
                                    <Typography variant="caption" component="span">
                                        {msg.message}
                                    </Typography>
                                </Box>
                                {canHighlight && (
                                    <IconButton
                                        className="pin-btn"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            pinnedComment?.id === msg.id ? unpinComment() : pinComment(msg);
                                        }}
                                        sx={{
                                            p: 0.25,
                                            opacity: pinnedComment?.id === msg.id ? 1 : 0,
                                            transition: 'opacity 0.2s',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PushPinIcon sx={{ fontSize: 12, transform: 'rotate(45deg)', color: pinnedComment?.id === msg.id ? 'primary.main' : 'text.secondary' }} />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        <div ref={chatEndRef} />
                    </Box>
                    {hasNewMessages && (
                        <Chip
                            label="Novos comentários"
                            size="small"
                            color="primary"
                            onClick={scrollToBottom}
                            sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                cursor: 'pointer',
                                zIndex: 1,
                                boxShadow: 2,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                            }}
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, p: 1, borderTop: 1, borderColor: 'divider' }}>
                    <TextField
                        size="small"
                        placeholder="Mensagem..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendChat();
                            }
                        }}
                        onFocus={(e) => {
                            setTimeout(() => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                        }}
                        fullWidth
                        inputProps={{ enterKeyHint: 'send' }}
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.875rem' } }}
                    />
                    <IconButton onClick={sendChat} color="primary" size="small" disabled={!chatInput.trim()}>
                        <SendIcon />
                    </IconButton>
                </Box>
            </Paper>

            {/* Participants dialog (host only) */}
            <Dialog open={showParticipants} onClose={() => setShowParticipants(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    Participantes ({participants.length})
                    {handRequests.length > 0 && (
                        <Chip label={`${handRequests.length} pedindo para falar`} color="warning" size="small" sx={{ ml: 1 }} />
                    )}
                </DialogTitle>
                <DialogContent>
                    {handRequests.length > 0 && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Pedidos para falar
                            </Typography>
                            <List dense>
                                {handRequests.map((req) => (
                                    <ListItem key={req.id}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ width: 32, height: 32 }}>{req.name.charAt(0)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={req.name} />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" color="success" onClick={() => promoteParticipant(req.id)} size="small">
                                                <CheckIcon />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                color="error"
                                                onClick={() => setHandRequests((prev) => prev.filter((r) => r.id !== req.id))}
                                                size="small"
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: handRequests.length > 0 ? 2 : 0 }}>
                        Na sala
                    </Typography>
                    <List dense>
                        {participants.map((p) => {
                            const isSpeakerP = promotedSpeakers.includes(p.identity);
                            const isHostP = event.creator?._id === p.identity;
                            return (
                                <ListItem key={p.identity}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}>{(p.name || p.identity).charAt(0)}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={p.name || p.identity}
                                        secondary={isHostP ? 'Host' : isSpeakerP ? 'Falando' : undefined}
                                    />
                                    {(isHost || isStaff) && isSpeakerP && !isHostP && (
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Silenciar">
                                                <IconButton edge="end" color="warning" onClick={() => demoteParticipant(p.identity)} size="small">
                                                    <MicOffIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowParticipants(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

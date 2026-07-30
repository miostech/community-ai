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

const MAX_DURATION_MS = 60 * 60 * 1000; // 1 hora

interface LiveEventData {
    _id: string;
    title: string;
    description?: string;
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

    const fetchEvent = useCallback(async () => {
        try {
            const res = await fetch(`/api/lives/${liveId}`);
            if (!res.ok) {
                setError('Live não encontrada');
                return;
            }
            const data = await res.json();
            setEvent(data.event);
        } catch {
            setError('Erro ao carregar live');
        }
    }, [liveId]);

    const fetchToken = useCallback(async () => {
        try {
            const res = await fetch(`/api/lives/${liveId}/token`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
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
        fetchEvent().then(() => fetchToken());
    }, [fetchEvent, fetchToken]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 2 }}>
                <Typography color="error">{error}</Typography>
                <Button variant="outlined" onClick={() => router.push('/dashboard/lives')}>
                    Voltar
                </Button>
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

    if (event.status === 'ended' || event.status === 'cancelled') {
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
                <Button variant="outlined" onClick={() => router.push('/dashboard/lives')}>
                    Voltar para Lives
                </Button>
            </Box>
        );
    }

    if (event.status === 'scheduled' && !isHost) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 2 }}>
                <VideocamIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6">{event.title}</Typography>
                <Typography color="text.secondary">A live ainda não começou. Aguarde o host iniciar.</Typography>
                <Button variant="outlined" onClick={() => router.push('/dashboard/lives')}>
                    Voltar
                </Button>
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
                setError('Não foi possível entrar na live. A sala pode estar lotada ou indisponível no momento.');
            }}
            onDisconnected={() => router.push('/dashboard/lives')}
            style={{ height: '100%' }}
        >
            <RoomContent
                event={event}
                isHost={isHost}
                isSpeaker={isSpeaker}
                liveId={liveId}
                accountId={account?.id || ''}
                onEnd={() => router.push('/dashboard/lives')}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 3 }}>
            <VideocamIcon sx={{ fontSize: 80, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {event.title}
            </Typography>
            {event.description && (
                <Typography color="text.secondary" sx={{ maxWidth: 500, textAlign: 'center' }}>
                    {event.description}
                </Typography>
            )}
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
            <Button variant="text" onClick={onBack}>
                Voltar
            </Button>
        </Box>
    );
}

function RoomContent({
    event,
    isHost,
    isSpeaker,
    liveId,
    accountId,
    onEnd,
}: {
    event: LiveEventData;
    isHost: boolean;
    isSpeaker: boolean;
    liveId: string;
    accountId: string;
    onEnd: () => void;
}) {
    const room = useRoomContext();
    const participants = useParticipants();
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone]);

    const [cameraOn, setCameraOn] = useState(isHost);
    const [micOn, setMicOn] = useState(isHost || isSpeaker);
    const [screenOn, setScreenOn] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [handRaised, setHandRaised] = useState(false);
    const [handRequests, setHandRequests] = useState<{ id: string; name: string }[]>([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [ending, setEnding] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const canPublish = isHost || isSpeaker;

    useEffect(() => {
        if (!event.started_at) return;
        const startTime = new Date(event.started_at).getTime();
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
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [event.started_at, isHost, liveId, room, onEnd]);

    useEffect(() => {
        if (!canPublish) return;
        room.localParticipant.setCameraEnabled(isHost).catch(() => {});
        room.localParticipant.setMicrophoneEnabled(isHost || isSpeaker).catch(() => {});
    }, [room, canPublish, isHost, isSpeaker]);

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
                } else if (parsed.type === 'hand_raise' && isHost) {
                    setHandRequests((prev) => {
                        if (prev.some((r) => r.id === parsed.sender)) return prev;
                        return [...prev, { id: parsed.sender, name: parsed.senderName || 'Participante' }];
                    });
                }
            } catch {}
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, isHost]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const toggleCamera = async () => {
        if (!canPublish) return;
        const next = !cameraOn;
        await room.localParticipant.setCameraEnabled(next);
        setCameraOn(next);
    };

    const toggleMic = async () => {
        if (!canPublish) return;
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
        const payload = {
            type: 'chat',
            sender: accountId,
            senderName: room.localParticipant.name || 'Eu',
            message: chatInput.trim(),
        };
        const data = TEXT_ENCODER.encode(JSON.stringify(payload));
        room.localParticipant.publishData(data, { reliable: true });
        setChatMessages((prev) => [
            ...prev.slice(-200),
            {
                id: `${Date.now()}-${accountId}`,
                sender: accountId,
                senderName: 'Eu',
                message: chatInput.trim(),
                timestamp: Date.now(),
            },
        ]);
        setChatInput('');
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

    const promoteParticipant = async (participantId: string) => {
        try {
            await fetch(`/api/lives/${liveId}/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: participantId }),
            });
            setHandRequests((prev) => prev.filter((r) => r.id !== participantId));
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

    const videoTracks = tracks.filter(
        (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { xs: 'auto', md: 'calc(100vh - 64px)' }, minHeight: { xs: '100vh', md: 'auto' } }}>
            {/* Video area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
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
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace' }}
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
                    {isHost && (
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

                {/* Video grid */}
                <Box sx={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: videoTracks.length > 1 ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
                    gap: 1,
                    p: 1,
                    bgcolor: 'black',
                    minHeight: { xs: 300, md: 0 },
                }}>
                    {videoTracks.length > 0 ? (
                        videoTracks.map((trackRef) => (
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Typography color="grey.500">Aguardando vídeo...</Typography>
                        </Box>
                    )}
                </Box>

                {/* Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider' }}>
                    {canPublish && (
                        <>
                            <IconButton onClick={toggleMic} sx={{ bgcolor: micOn ? 'action.selected' : 'error.main', color: micOn ? 'text.primary' : 'white', '&:hover': { bgcolor: micOn ? 'action.hover' : 'error.dark' } }}>
                                {micOn ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                            <IconButton onClick={toggleCamera} sx={{ bgcolor: cameraOn ? 'action.selected' : 'error.main', color: cameraOn ? 'text.primary' : 'white', '&:hover': { bgcolor: cameraOn ? 'action.hover' : 'error.dark' } }}>
                                {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </>
                    )}
                    {isHost && (
                        <IconButton onClick={toggleScreen} sx={{ bgcolor: screenOn ? 'primary.main' : 'action.selected', color: screenOn ? 'white' : 'text.primary' }}>
                            {screenOn ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>
                    )}
                    {!canPublish && !handRaised && (
                        <Button
                            variant="outlined"
                            startIcon={<HandIcon />}
                            onClick={raiseHand}
                            size="small"
                        >
                            Pedir para falar
                        </Button>
                    )}
                    {!canPublish && handRaised && (
                        <Chip label="Mão levantada" icon={<HandIcon />} color="warning" size="small" />
                    )}
                    {isHost ? (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={ending ? <CircularProgress size={16} /> : <CallEndIcon />}
                            onClick={handleEnd}
                            disabled={ending}
                            size="small"
                        >
                            Encerrar
                        </Button>
                    ) : (
                        <IconButton
                            onClick={() => { room.disconnect(); onEnd(); }}
                            sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                        >
                            <CallEndIcon />
                        </IconButton>
                    )}
                </Box>
            </Box>

            {/* Chat sidebar */}
            <Paper
                elevation={0}
                sx={{
                    width: { xs: '100%', md: 320 },
                    height: { xs: 300, md: '100%' },
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
                <Box sx={{ flex: 1, overflow: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {chatMessages.map((msg) => (
                        <Box key={msg.id}>
                            <Typography variant="caption" component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                                {msg.senderName}:
                            </Typography>
                            <Typography variant="caption" component="span">
                                {msg.message}
                            </Typography>
                        </Box>
                    ))}
                    <div ref={chatEndRef} />
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
                        fullWidth
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
                        {participants.map((p) => (
                            <ListItem key={p.identity}>
                                <ListItemAvatar>
                                    <Avatar sx={{ width: 32, height: 32 }}>{(p.name || p.identity).charAt(0)}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={p.name || p.identity} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowParticipants(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  InputBase,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
  Visibility as VisibilityIcon,
  ChatBubbleOutline as ChatBubbleIcon,
  Send as SendIcon,
  DeleteOutline as DeleteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';

export type StoryViewerInfo = {
  id: string;
  name: string;
  avatar: string | null;
  viewed_at: string;
};

export type ViewsByStory = Record<string, { count: number; viewers: StoryViewerInfo[] }>;

export type StoryItem = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  /** Texto sobre a foto/vídeo (estilo Instagram) */
  text?: string;
  /** Posição do texto em % (0-100). Se não definido, usa barra inferior. */
  text_x?: number;
  text_y?: number;
  created_at: string;
};

export type StoryViewerCloseOptions = { completedAll?: boolean };

export type StoryCommentItem = {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  liked: boolean;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

interface StoryViewerProps {
  stories: StoryItem[];
  userName: string;
  open: boolean;
  /** Chamado ao fechar. completedAll: true quando o usuário estava no último story (viu todos). */
  onClose: (opts?: StoryViewerCloseOptions) => void;
  initialIndex?: number;
  /** Se true, mostra botão para excluir o story atual (próprio perfil). */
  canDelete?: boolean;
  /** Chamado ao excluir; o componente não remove da lista — a lista é atualizada pelo pai. */
  onDeleteStory?: (storyId: string) => Promise<void>;
  /** Chamado quando o usuário visualiza um story (para registrar view; não passar no próprio perfil). */
  onStoryViewed?: (storyId: string) => void;
  /** Quem e quantas pessoas viram cada story (só no próprio perfil). Chave = storyId. */
  viewsByStory?: ViewsByStory;
  /** ID da conta do dono do story (para buscar comentários). Se undefined, comentários ficam desabilitados. */
  storyOwnerId?: string | null;
}

const STORY_DURATION_MS = 5000;

function formatStoryTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'agora';
  if (diffInSeconds < 3600) {
    const min = Math.floor(diffInSeconds / 60);
    return min === 1 ? '1 minuto atrás' : `${min} minutos atrás`;
  }
  if (diffInSeconds < 86400) {
    const h = Math.floor(diffInSeconds / 3600);
    return h === 1 ? '1 hora atrás' : `${h} horas atrás`;
  }
  if (diffInSeconds < 604800) {
    const d = Math.floor(diffInSeconds / 86400);
    return d === 1 ? '1 dia atrás' : `${d} dias atrás`;
  }
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

export function StoryViewer({
  stories,
  userName,
  open,
  onClose,
  initialIndex = 0,
  canDelete = false,
  onDeleteStory,
  onStoryViewed,
  viewsByStory = {},
  storyOwnerId,
}: StoryViewerProps) {
  const { account } = useAccount();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewsDrawerOpen, setViewsDrawerOpen] = useState(false);
  /** Começa mutado para autoplay funcionar (política do browser); usuário pode ativar o som. */
  const [isMuted, setIsMuted] = useState(true);
  /** True quando a mídia (imagem ou vídeo) do story atual terminou de carregar — evita tela preta. */
  const [mediaReady, setMediaReady] = useState(false);

  // Comments state
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [commentsByStory, setCommentsByStory] = useState<Record<string, StoryCommentItem[]>>({});
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  /** Índice seguro para não renderizar com current indefinido (ex.: lista trocou e currentIndex ficou fora do range). */
  const safeIndex =
    stories.length === 0 ? 0 : Math.min(currentIndex, Math.max(0, stories.length - 1));
  const current = stories[safeIndex];
  const isVideo = current?.media_type === 'video';

  useEffect(() => {
    if (currentIndex !== safeIndex) setCurrentIndex(safeIndex);
  }, [currentIndex, safeIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose({ completedAll: true });
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!open || !current) return;
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [open, initialIndex]);

  /** Cada novo story começa mutado (autoplay); usuário pode ativar o som. */
  useEffect(() => {
    if (current?.id) setIsMuted(true);
  }, [current?.id]);

  /** Ao trocar de story, resetar estado de carregamento da mídia. */
  useEffect(() => {
    setMediaReady(false);
  }, [current?.id]);

  /** Registrar visualização quando o usuário vê um story (perfil de outro). */
  useEffect(() => {
    if (!open || !current?.id || !onStoryViewed) return;
    onStoryViewed(current.id);
  }, [open, current?.id, onStoryViewed]);

  useEffect(() => {
    if (!open) return;
    if (stories.length === 0) onClose();
    else if (currentIndex >= stories.length) setCurrentIndex(Math.max(0, stories.length - 1));
  }, [open, stories.length, currentIndex, onClose]);

  useEffect(() => {
    return () => { if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current); };
  }, []);

  const timerPaused = deleteConfirmOpen || commentsDrawerOpen || inputFocused;

  useEffect(() => {
    if (!open || !current || timerPaused) return;
    if (isVideo) {
      setProgress(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const value = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(value);
      if (value >= 100) {
        clearInterval(interval);
        goNext();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [open, current?.id, isVideo, goNext, timerPaused]);

  const handleDelete = async () => {
    if (!current?.id || !onDeleteStory || deleting) return;
    setDeleteConfirmOpen(false);
    setDeleting(true);
    try {
      await onDeleteStory(current.id);
    } finally {
      setDeleting(false);
    }
  };

  const fetchComments = useCallback(async (storyId: string) => {
    try {
      const res = await fetch(`/api/stories/${storyId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setCommentsByStory((prev) => ({ ...prev, [storyId]: data.comments || [] }));
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!open || !current?.id) return;
    if (!commentsByStory[current.id]) {
      fetchComments(current.id);
    }
  }, [open, current?.id, fetchComments, commentsByStory]);

  useEffect(() => {
    if (commentsDrawerOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [commentsDrawerOpen, commentsByStory[current?.id ?? '']?.length]);

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || !current?.id || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/stories/${current.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setCommentsByStory((prev) => ({
            ...prev,
            [current.id]: [...(prev[current.id] || []), data.comment],
          }));
        }
        setCommentText('');
      }
    } catch {
      // silently fail
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!current?.id) return;
    try {
      const res = await fetch(`/api/stories/${current.id}/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setCommentsByStory((prev) => ({
          ...prev,
          [current.id]: (prev[current.id] || []).filter((c) => c.id !== commentId),
        }));
      }
    } catch {
      // silently fail
    }
  };

  const handleToggleLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!current?.id) return;
    const method = currentlyLiked ? 'DELETE' : 'POST';
    setCommentsByStory((prev) => ({
      ...prev,
      [current.id]: (prev[current.id] || []).map((c) =>
        c.id === commentId
          ? { ...c, liked: !currentlyLiked, likes_count: c.likes_count + (currentlyLiked ? -1 : 1) }
          : c
      ),
    }));
    try {
      await fetch(`/api/stories/${current.id}/comments/${commentId}/like`, { method });
    } catch {
      setCommentsByStory((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] || []).map((c) =>
          c.id === commentId
            ? { ...c, liked: currentlyLiked, likes_count: c.likes_count + (currentlyLiked ? 1 : -1) }
            : c
        ),
      }));
    }
  };

  const currentComments = current?.id ? (commentsByStory[current.id] || []) : [];
  const commentsCount = currentComments.length;

  if (!open || stories.length === 0 || !current) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: { xs: 0, md: '256px' },
        zIndex: 1400,
        bgcolor: 'black',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Barras de progresso */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          px: 1,
          pt: 1,
        }}
      >
        {stories.map((_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.3)',
              overflow: 'hidden',
            }}
          >
            <LinearProgress
              variant="determinate"
              value={
                i < safeIndex ? 100 : i === safeIndex ? progress : 0
              }
              sx={{
                height: '100%',
                bgcolor: 'transparent',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                },
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Header (zIndex acima da área clicável para o olho e o X não avançarem o story) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 1.5,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
            {userName}
          </Typography>
          {current?.created_at && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }}>
              {formatStoryTimeAgo(current.created_at)}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {canDelete && current?.id && (
            <>
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewsDrawerOpen(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                size="small"
                sx={{ color: 'white' }}
                aria-label="Quem viu este story"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
              {viewsByStory[current.id] != null && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {viewsByStory[current.id].count}
                </Typography>
              )}
            </>
          )}
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose({ completedAll: currentIndex === stories.length - 1 });
            }}
            onPointerDown={(e) => e.stopPropagation()}
            size="small"
            sx={{ color: 'white' }}
            aria-label="Fechar"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Área clicável: esquerda = voltar, direita = avançar */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          position: 'relative',
        }}
      >
        <Box
          onClick={() => !deleteConfirmOpen && goPrev()}
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '40%',
            zIndex: 2,
            cursor: !deleteConfirmOpen && currentIndex > 0 ? 'pointer' : 'default',
          }}
        />
        <Box
          onClick={() => !deleteConfirmOpen && goNext()}
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '60%',
            zIndex: 2,
            cursor: !deleteConfirmOpen ? 'pointer' : 'default',
          }}
        />
      </Box>

      {/* Mídia */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: 5,
          pb: 2,
          px: 1,
        }}
      >
        {/* Overlay de carregamento: evita tela preta até a mídia estar pronta */}
        {!mediaReady && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              zIndex: 5,
              bgcolor: 'black',
            }}
          >
            <CircularProgress size={40} sx={{ color: 'white' }} />
            <Typography color="white" variant="body2">
              Carregando...
            </Typography>
          </Box>
        )}
        {current.media_type === 'image' ? (
          <Box
            component="img"
            src={current.media_url}
            alt="Story"
            onLoad={() => setMediaReady(true)}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              opacity: mediaReady ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
            }}
          />
        ) : (
          <>
            <Box
              component="video"
              src={current.media_url}
              autoPlay
              playsInline
              muted={isMuted}
              loop={false}
              onLoadedData={() => setMediaReady(true)}
              onEnded={() => !deleteConfirmOpen && goNext()}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                opacity: mediaReady ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
              }}
            />
            {/* Mute button moved to bottom bar */}
          </>
        )}
      </Box>

      {/* Barra inferior: comentário + ações — no mobile fica acima da tab bar (~60px) */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: { xs: 'max(60px, calc(env(safe-area-inset-bottom, 0px) + 60px))', md: 0 },
          zIndex: 15,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            pointerEvents: 'auto',
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 70%, transparent)',
            pt: 2,
            pb: { xs: 1, md: 2 },
            px: 1.5,
          }}
        >
          {/* Input de comentário */}
          {storyOwnerId && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 0.75,
              }}
            >
              <InputBase
                inputRef={inputRef}
                placeholder="Enviar comentário..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={() => {
                  if (blurTimeoutRef.current) { clearTimeout(blurTimeoutRef.current); blurTimeoutRef.current = null; }
                  setInputFocused(true);
                }}
                onBlur={() => {
                  blurTimeoutRef.current = setTimeout(() => { setInputFocused(false); }, 300);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  borderRadius: 5,
                  px: 1.5,
                  py: 0.6,
                  fontSize: { xs: '1rem', md: '0.8125rem' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.55)', opacity: 1 },
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                inputProps={{ maxLength: 500 }}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendComment();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={!commentText.trim() || sendingComment}
                size="small"
                sx={{
                  color: commentText.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                  flexShrink: 0,
                  p: 0.75,
                }}
                aria-label="Enviar comentário"
              >
                {sendingComment ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SendIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Box>
          )}

          {/* Ações: chat, mute, delete */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {storyOwnerId && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentsDrawerOpen(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                size="small"
                sx={{ color: 'white', p: 0.75 }}
                aria-label="Ver comentários"
              >
                <Badge badgeContent={commentsCount} color="primary" max={99}>
                  <ChatBubbleIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            )}

            <Box sx={{ flex: 1 }} />

            {isVideo && (
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMuted((m) => !m);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                size="small"
                sx={{ color: 'white', p: 0.75 }}
                aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
              >
                {isMuted ? <VolumeOffIcon sx={{ fontSize: 20 }} /> : <VolumeUpIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            )}

            {canDelete && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmOpen(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={deleting}
                size="small"
                sx={{ color: 'white', p: 0.75 }}
                aria-label="Opções do story"
              >
                <MoreVertIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {/* Texto sobre a foto/vídeo (posição definida no editor ou barra inferior) */}
      {current.text && (
        <Box
          sx={{
            position: 'absolute',
            ...(current.text_x != null && current.text_y != null
              ? {
                  left: `${current.text_x}%`,
                  top: `${current.text_y}%`,
                  transform: 'translate(-50%, -50%)',
                  p: 0,
                }
              : {
                  left: 0,
                  right: 0,
                  bottom: storyOwnerId ? { xs: 160, md: 100 } : 0,
                  p: 2,
                  pt: 6,
                  background: storyOwnerId ? 'none' : 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }),
            zIndex: 3,
            maxWidth: '90%',
          }}
        >
          <Typography
            sx={{
              color: 'white',
              textAlign: 'center',
              textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,0.8)',
              fontSize: current.text_x != null ? '1.125rem' : '1rem',
              lineHeight: 1.4,
              maxWidth: '100%',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {current.text}
          </Typography>
        </Box>
      )}

      {/* Diálogo: Deseja excluir esse story? */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 280 } }}
      >
        <DialogTitle>Excluir story</DialogTitle>
        <DialogContent>
          <Typography>Deseja excluir esse story?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Não
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Excluindo...' : 'Sim'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer: quem viu este story (só no próprio perfil) */}
      <Drawer
        anchor="bottom"
        open={viewsDrawerOpen}
        onClose={() => setViewsDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Quem viu este story</Typography>
            <IconButton onClick={() => setViewsDrawerOpen(false)} aria-label="Fechar">
              <CloseIcon />
            </IconButton>
          </Box>
          {current?.id && viewsByStory[current.id] != null ? (
            viewsByStory[current.id].viewers.length === 0 ? (
              <Typography color="text.secondary">Ninguém visualizou ainda.</Typography>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {viewsByStory[current.id].count} {viewsByStory[current.id].count === 1 ? 'pessoa viu' : 'pessoas viram'}
                </Typography>
                <List disablePadding>
                  {viewsByStory[current.id].viewers.map((v) => (
                    <ListItem key={v.id} disablePadding sx={{ py: 0.5 }}>
                      <ListItemAvatar>
                        <Avatar src={v.avatar || undefined} alt={v.name} sx={{ width: 40, height: 40 }}>
                          {v.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={v.name}
                        secondary={v.viewed_at ? new Date(v.viewed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )
          ) : (
            <Typography color="text.secondary">Carregando...</Typography>
          )}
        </Box>
      </Drawer>

      {/* Drawer: comentários do story */}
      <Drawer
        anchor="bottom"
        open={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 3, display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Comentários{commentsCount > 0 ? ` (${commentsCount})` : ''}
            </Typography>
            <IconButton onClick={() => setCommentsDrawerOpen(false)} aria-label="Fechar">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
            {currentComments.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Nenhum comentário ainda. Seja o primeiro!
              </Typography>
            ) : (
              <List disablePadding>
                {currentComments.map((c) => (
                  <ListItem key={c.id} disablePadding sx={{ py: 0.75, alignItems: 'flex-start' }}>
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        src={c.author.avatar_url || undefined}
                        alt={c.author.name}
                        sx={{ width: 32, height: 32 }}
                      >
                        {c.author.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <Typography component="span" fontWeight={600} variant="body2">
                            {c.author.name}
                          </Typography>{' '}
                          {c.content}
                        </Typography>
                      }
                      secondary={formatStoryTimeAgo(c.created_at)}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 0.5, mt: 0.5, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleLike(c.id, c.liked)}
                        sx={{ p: 0.25, color: c.liked ? 'error.main' : 'text.secondary' }}
                        aria-label={c.liked ? 'Descurtir' : 'Curtir'}
                      >
                        {c.liked ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                      {c.likes_count > 0 && (
                        <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1 }}>
                          {c.likes_count}
                        </Typography>
                      )}
                      {account?.id === c.author.id && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteComment(c.id)}
                          sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                          aria-label="Apagar comentário"
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                ))}
                <div ref={commentsEndRef} />
              </List>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

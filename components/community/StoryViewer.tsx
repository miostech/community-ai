'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon, MoreVert as MoreVertIcon, VolumeOff as VolumeOffIcon, VolumeUp as VolumeUpIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

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
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewsDrawerOpen, setViewsDrawerOpen] = useState(false);
  /** Começa mutado para autoplay funcionar (política do browser); usuário pode ativar o som. */
  const [isMuted, setIsMuted] = useState(true);

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
    if (!open || !current || deleteConfirmOpen) return;
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
  }, [open, current?.id, isVideo, goNext, deleteConfirmOpen]);

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

  if (!open || stories.length === 0 || !current) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
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
        {current.media_type === 'image' ? (
          <Box
            component="img"
            src={current.media_url}
            alt="Story"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
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
              onEnded={() => !deleteConfirmOpen && goNext()}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMuted((m) => !m);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              size="medium"
              sx={{
                position: 'absolute',
                left: 16,
                bottom: 'max(24px, env(safe-area-inset-bottom, 0px) + 72px)',
                zIndex: 20,
                pointerEvents: 'auto',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
              aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
          </>
        )}
      </Box>

      {/* Botão 3 pontinhos (excluir) - canto inferior direito, acima da tab bar */}
      {canDelete && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 'max(24px, env(safe-area-inset-bottom, 0px) + 72px)',
            zIndex: 15,
            pointerEvents: 'auto',
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmOpen(true);
            }}
            disabled={deleting}
            size="large"
            sx={{
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.6)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              '& .MuiSvgIcon-root': { fontSize: 28 },
            }}
            aria-label="Opções do story"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      )}

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
                  bottom: 0,
                  p: 2,
                  pt: 6,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)',
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
    </Box>
  );
}

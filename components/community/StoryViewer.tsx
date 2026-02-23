'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  LinearProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

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

interface StoryViewerProps {
  stories: StoryItem[];
  userName: string;
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const STORY_DURATION_MS = 5000;

export function StoryViewer({
  stories,
  userName,
  open,
  onClose,
  initialIndex = 0,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const current = stories[currentIndex];
  const isVideo = current?.media_type === 'video';

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
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

  useEffect(() => {
    if (!open || !current) return;
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
  }, [open, current?.id, isVideo, goNext]);

  if (!open || stories.length === 0) return null;

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
                i < currentIndex ? 100 : i === currentIndex ? progress : 0
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

      {/* Header */}
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
          zIndex: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
          {userName}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'white' }}
          aria-label="Fechar"
        >
          <CloseIcon />
        </IconButton>
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
          onClick={goPrev}
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '40%',
            zIndex: 2,
            cursor: currentIndex > 0 ? 'pointer' : 'default',
          }}
        />
        <Box
          onClick={goNext}
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '60%',
            zIndex: 2,
            cursor: 'pointer',
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
          <Box
            component="video"
            src={current.media_url}
            autoPlay
            playsInline
            muted
            loop={false}
            onEnded={goNext}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}
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
    </Box>
  );
}

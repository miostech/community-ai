'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon } from '@mui/icons-material';

const DEFAULT_TEXT_X = 50;
const DEFAULT_TEXT_Y = 85;

export interface StoryEditorPayload {
  text: string;
  text_x: number;
  text_y: number;
}

interface StoryTextEditorModalProps {
  open: boolean;
  onClose: () => void;
  /** URL do preview (object URL da mídia) */
  previewUrl: string;
  isVideo: boolean;
  initialText?: string;
  initialTextX?: number;
  initialTextY?: number;
  onBack: () => void;
  onPublish: (payload: StoryEditorPayload) => void;
  isPublishing?: boolean;
}

export function StoryTextEditorModal({
  open,
  onClose,
  previewUrl,
  isVideo,
  initialText = '',
  initialTextX = DEFAULT_TEXT_X,
  initialTextY = DEFAULT_TEXT_Y,
  onBack,
  onPublish,
  isPublishing = false,
}: StoryTextEditorModalProps) {
  const [text, setText] = useState(initialText);
  const [textX, setTextX] = useState(initialTextX);
  const [textY, setTextY] = useState(initialTextY);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setTextX(initialTextX);
      setTextY(initialTextY);
    }
  }, [open, initialText, initialTextX, initialTextY]);

  const updatePositionFromClient = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setTextX(Math.min(95, Math.max(5, x)));
    setTextY(Math.min(95, Math.max(5, y)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      updatePositionFromClient(clientX, clientY);
    },
    [updatePositionFromClient]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      updatePositionFromClient(clientX, clientY);
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, updatePositionFromClient]);

  const handlePublish = () => {
    onPublish({ text: text.trim(), text_x: textX, text_y: textY });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: '#000',
          maxWidth: '100%',
          maxHeight: '100%',
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
            zIndex: 10,
          }}
        >
          <IconButton onClick={onBack} sx={{ color: 'white' }} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
            Editar story
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Preview + texto arrastável */}
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {isVideo ? (
            <Box
              component="video"
              src={previewUrl}
              autoPlay
              loop
              muted
              playsInline
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          )}

          {/* Texto sobre a mídia (arrastável) */}
          <Box
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            sx={{
              position: 'absolute',
              left: `${textX}%`,
              top: `${textY}%`,
              transform: 'translate(-50%, -50%)',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
              px: 2,
              py: 1,
              maxWidth: '90%',
              zIndex: 5,
            }}
          >
            <Typography
              sx={{
                color: 'white',
                textAlign: 'center',
                textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,0.8)',
                fontSize: '1.125rem',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                pointerEvents: 'none',
              }}
            >
              {text.trim() || 'Toque para adicionar texto'}
            </Typography>
          </Box>
        </Box>

        {/* Campo legenda + Publicar */}
        <Box
          sx={{
            p: 2,
            pt: 1,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Arraste o texto na imagem para mudar de lugar
          </Typography>
          <TextField
            label="Adicione uma legenda"
            placeholder="Escreva sobre a foto ou vídeo..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            fullWidth
            size="small"
            multiline
            maxRows={3}
            inputProps={{ maxLength: 500 }}
            helperText={`${text.length}/500`}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onBack} disabled={isPublishing}>
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

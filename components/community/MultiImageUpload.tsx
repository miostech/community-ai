'use client';

import React, { useRef } from 'react';
import { Box, Typography, IconButton, alpha, useTheme } from '@mui/material';
import { Image as ImageIcon, Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';

interface MultiImageUploadProps {
  onImagesSelect: (files: File[]) => void;
  currentImages: string[];
  onRemoveImage: (index: number) => void;
  maxImages?: number;
}

export function MultiImageUpload({
  onImagesSelect,
  currentImages,
  onRemoveImage,
  maxImages = 10,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesSelect(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = currentImages.length < maxImages;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Grid de imagens */}
      {currentImages.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}
        >
          {currentImages.map((image, index) => (
            <Box
              key={index}
              sx={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'action.hover',
                '&:hover .remove-btn': { opacity: 1 },
              }}
            >
              <Box
                component="img"
                src={image}
                alt={`Imagem ${index + 1}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Badge de ordem */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: alpha('#000', 0.7),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 500,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {index + 1}
              </Box>

              {/* Botão remover */}
              <IconButton
                className="remove-btn"
                onClick={() => onRemoveImage(index)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'error.main',
                  color: 'white',
                  opacity: { xs: 1, sm: 0 },
                  transition: 'opacity 0.2s',
                  '&:hover': { bgcolor: 'error.dark' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              {/* Badge Capa */}
              {index === 0 && currentImages.length > 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: 10,
                    px: 1,
                    py: 0.25,
                    borderRadius: 2,
                    fontWeight: 500,
                  }}
                >
                  Capa
                </Box>
              )}
            </Box>
          ))}

          {/* Botão adicionar mais */}
          {canAddMore && (
            <Box
              onClick={handleClick}
              sx={{
                aspectRatio: '1',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                cursor: 'pointer',
                bgcolor: theme.palette.mode === 'dark' ? 'neutral.800' : 'grey.50',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: theme.palette.mode === 'dark' ? 'neutral.700' : alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <AddIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Adicionar
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Botão inicial (quando não tem imagens) */}
      {currentImages.length === 0 && (
        <Box
          onClick={handleClick}
          sx={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            cursor: 'pointer',
            bgcolor: theme.palette.mode === 'dark' ? 'neutral.800' : 'grey.50',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: theme.palette.mode === 'dark' ? 'neutral.700' : alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={600}>
              Adicionar imagens
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Até {maxImages} imagens
            </Typography>
          </Box>
        </Box>
      )}

      {/* Info */}
      {currentImages.length > 0 && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {currentImages.length} de {maxImages} imagens • A primeira será a capa
        </Typography>
      )}

      {/* Input escondido */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
}

'use client';

import React from 'react';
import { Box } from '@mui/material';

const ASTERISK_FULLWIDTH = '\uFF0A'; // ＊
const BOLD_MARKER = '**';

/**
 * Renderiza o texto com suporte a negrito no estilo Markdown: **texto** vira negrito.
 * Apenas ** é interpretado; quebras de linha são preservadas (salvo se inline).
 * Aceita asterisco normal (*) e fullwidth (＊).
 * @param inline quando true, uma linha com ellipsis (ex.: notificações)
 */
export function PostContentText({ content, inline }: { content: string; inline?: boolean }) {
  if (!content || typeof content !== 'string') return null;

  // Normaliza asteriscos fullwidth para normais
  const normalized = content.replace(new RegExp(ASTERISK_FULLWIDTH, 'g'), '*');

  // Split por **: índices ímpares ficam em negrito (ex.: "da **Dome**," → ["da ", "Dome", ","])
  const segments = normalized.split(BOLD_MARKER);
  if (segments.length === 1) {
    return (
      <Box
        component="span"
        sx={{
          whiteSpace: inline ? 'nowrap' : 'pre-line',
          wordBreak: 'break-word',
          ...(inline && { overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }),
        }}
      >
        {content}
      </Box>
    );
  }

  const parts: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    if (i % 2 === 1) {
      parts.push(<strong key={i} style={{ fontWeight: 700 }}>{seg}</strong>);
    } else {
      parts.push(<span key={i}>{seg}</span>);
    }
  });

  return (
    <Box
      component="span"
      sx={{
        whiteSpace: inline ? 'nowrap' : 'pre-line',
        wordBreak: 'break-word',
        ...(inline && { overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }),
        '& strong': { fontWeight: 700 },
      }}
    >
      {parts}
    </Box>
  );
}

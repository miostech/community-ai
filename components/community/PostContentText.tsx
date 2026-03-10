'use client';

import React from 'react';
import { Box } from '@mui/material';

/**
 * Renderiza o texto do post com suporte a negrito no estilo Markdown: **texto** vira negrito.
 * Apenas ** é interpretado; quebras de linha são preservadas.
 */
export function PostContentText({ content }: { content: string }) {
  if (!content) return null;

  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
      <span key={key++}>{content.slice(lastIndex, match.index)}</span>
      );
    }
    parts.push(
      <strong key={key++}>{match[1]}</strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return (
    <Box
      component="span"
      sx={{
        whiteSpace: 'pre-line',
        wordBreak: 'break-word',
        '& strong': { fontWeight: 700 },
      }}
    >
      {parts.length > 0 ? parts : content}
    </Box>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

function formatRemaining(until: Date): { d: number; h: number; m: number; s: number } {
  const now = Date.now();
  const end = until.getTime();
  let diff = Math.max(0, Math.floor((end - now) / 1000));
  const d = Math.floor(diff / 86400);
  diff -= d * 86400;
  const h = Math.floor(diff / 3600);
  diff -= h * 3600;
  const m = Math.floor(diff / 60);
  diff -= m * 60;
  const s = diff;
  return { d, h, m, s };
}

export function Countdown({ until }: { until: Date }) {
  const [t, setT] = useState(() => formatRemaining(until));

  useEffect(() => {
    const interval = setInterval(() => {
      setT(formatRemaining(until));
    }, 1000);
    return () => clearInterval(interval);
  }, [until]);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 1, sm: 2 },
        justifyContent: 'center',
        flexWrap: 'wrap',
        mt: { xs: 2.5, sm: 3 },
      }}
    >
      {[
        { value: t.d, label: 'dias' },
        { value: t.h, label: 'horas' },
        { value: t.m, label: 'min' },
        { value: t.s, label: 'seg' },
      ].map(({ value, label }) => (
        <Box
          key={label}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: { xs: 1.5, sm: 2 },
            px: { xs: 1.25, sm: 2.5 },
            py: { xs: 1, sm: 1.5 },
            minWidth: { xs: 52, sm: 72 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary.main"
            sx={{ fontSize: { xs: '1.1rem', sm: 'inherit' } }}
          >
            {String(value).padStart(2, '0')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: 'inherit' } }}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

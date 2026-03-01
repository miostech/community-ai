'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { LockClock as LockClockIcon } from '@mui/icons-material';

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

function Countdown({ until }: { until: Date }) {
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

export default function TrabalhosLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, canAccessTrabalhos, trabalhosUnlockAt } = useAccount();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!canAccessTrabalhos && trabalhosUnlockAt) {
    return (
      <Box
        sx={{
          maxWidth: 560,
          mx: 'auto',
          px: { xs: 1.5, sm: 2 },
          py: { xs: 3, sm: 6 },
          pb: { xs: 8, sm: 6 },
          minHeight: { xs: 'calc(100vh - 120px)', sm: 'auto' },
          display: { xs: 'flex', sm: 'block' },
          alignItems: { xs: 'center', sm: 'stretch' },
          justifyContent: { xs: 'center', sm: 'flex-start' },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: { xs: 2, sm: 3 },
            border: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <LockClockIcon sx={{ fontSize: { xs: 44, sm: 56 }, color: 'action.disabled', mb: { xs: 1.5, sm: 2 } }} />
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '1rem', sm: 'inherit' } }}
          >
            Vitrine de campanhas
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: 'inherit' }, lineHeight: 1.45, px: { xs: 0.5, sm: 0 } }}
          >
            Essa funcionalidade será liberada para você depois de 7 dias.
          </Typography>
          <Countdown until={trabalhosUnlockAt} />
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
}

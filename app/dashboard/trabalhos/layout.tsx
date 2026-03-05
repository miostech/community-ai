'use client';

import React from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { LockClock as LockClockIcon } from '@mui/icons-material';
import { Countdown } from '@/components/shared/Countdown';

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

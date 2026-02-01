'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar automaticamente para a comunidade após login
    router.push('/dashboard/comunidade');
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Redirecionando para a comunidade...
        </Typography>
      </Box>
    </Box>
  );
}

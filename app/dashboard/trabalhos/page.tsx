'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function TrabalhosPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard/trabalhos/vitrine');
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Redirecionando...
        </Typography>
      </Box>
    </Box>
  );
}

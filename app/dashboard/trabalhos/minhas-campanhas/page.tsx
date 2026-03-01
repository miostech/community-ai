'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  WorkOutline as WorkIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

export default function MinhasCampanhasPage() {
  const theme = useTheme();

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
      <TrabalhosTabs />

      <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}
        >
          Minhas Campanhas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Acompanhe as campanhas em que você está participando.
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 5 },
          borderRadius: { xs: 3, sm: 4 },
          border: 1,
          borderColor: 'divider',
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha('#ec4899', 0.04)})`,
        }}
      >
        <Box
          sx={{
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
          }}
        >
          <WorkIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
        </Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.95rem', sm: '1.2rem' } }}
        >
          Nenhuma campanha ainda
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 380, mx: 'auto', lineHeight: 1.7, mb: 2.5, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}
        >
          Quando você for selecionado para uma campanha, ela aparecerá aqui.
        </Typography>
        <Button
          component={Link}
          href="/dashboard/trabalhos/vitrine"
          variant="outlined"
          size="small"
          startIcon={<StorefrontIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            fontSize: { xs: '0.8rem', sm: '0.85rem' },
          }}
        >
          Explorar campanhas
        </Button>
      </Paper>
    </Box>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useAccount } from '@/contexts/AccountContext';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Alert,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

export default function VitrineCampanhasPage() {
  const theme = useTheme();
  const { isMidiaKitComplete } = useAccount();

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
      <TrabalhosTabs />

      {!isMidiaKitComplete && (
        <Alert
          severity="warning"
          icon={<BadgeIcon fontSize="small" />}
          action={
            <Button
              component={Link}
              href="/dashboard/trabalhos/portfolio"
              color="inherit"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.72rem', sm: '0.8rem' }, whiteSpace: 'nowrap' }}
            >
              Completar perfil
            </Button>
          }
          sx={{
            mb: { xs: 2, sm: 3 },
            borderRadius: { xs: 2, sm: 2.5 },
            fontSize: { xs: '0.78rem', sm: '0.85rem' },
            alignItems: 'center',
            '& .MuiAlert-message': { flex: 1 },
          }}
        >
          Complete seu Portfólio para poder se candidatar a campanhas.
        </Alert>
      )}

      <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}
        >
          Vitrine de Campanhas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Explore campanhas de marcas e candidate-se.
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
          mb: { xs: 3, sm: 4 },
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
          <CampaignIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
        </Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.95rem', sm: '1.2rem' } }}
        >
          Campanhas chegando em breve!
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 480, mx: 'auto', lineHeight: 1.7, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}
        >
          Estamos preparando as primeiras campanhas com marcas parceiras. 
          Em breve você poderá visualizar oportunidades, filtrar por nicho e se candidatar 
          diretamente pela plataforma.
        </Typography>
      </Paper>

      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}
      >
        Como vai funcionar
      </Typography>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {[
          {
            step: '1',
            title: 'Marcas publicam campanhas',
            description: 'As marcas criam campanhas com briefing, requisitos e valores.',
          },
          {
            step: '2',
            title: 'Você se candidata',
            description: 'Veja as campanhas disponíveis e candidate-se às que combinam com seu perfil.',
          },
          {
            step: '3',
            title: 'Marca seleciona',
            description: 'A marca avalia seu perfil e portfólio, e seleciona os creators ideais.',
          },
          {
            step: '4',
            title: 'Crie e entregue',
            description: 'Produza o conteúdo, envie para aprovação e receba pelo trabalho.',
          },
        ].map((item) => (
          <Grid size={{ xs: 6, sm: 6 }} key={item.step}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: { xs: 2.5, sm: 3 },
                border: 1,
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '1.2rem', sm: '1.5rem' },
                  fontWeight: 800,
                  color: alpha(theme.palette.primary.main, 0.15),
                  mb: 0.5,
                  lineHeight: 1,
                }}
              >
                {item.step}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                {item.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

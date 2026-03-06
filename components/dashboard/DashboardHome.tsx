'use client';

import React from 'react';
import Link from 'next/link';
import { useAccount } from '@/contexts/AccountContext';
import { Box, Paper, Grid, Typography, useTheme, alpha } from '@mui/material';
import {
  Group as GroupIcon,
  Chat as ChatIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

interface HomeCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function getCards(): HomeCard[] {
  return [
    // Linha 1: Feed e Trabalhos
    {
      title: 'Feed',
      description: 'Compartilhe e cresça com a comunidade.',
      href: '/dashboard/comunidade',
      icon: <GroupIcon />,
    },
    {
      title: 'Trabalhos',
      description: 'Campanhas com marcas',
      href: '/dashboard/trabalhos',
      icon: <WorkIcon />,
    },
    // Linha 2: Chat com IA e Cursos
    {
      title: 'Chat com IA',
      description: 'Tire dúvidas e crie conteúdo com IA',
      href: '/dashboard/chat',
      icon: <ChatIcon />,
    },
    {
      title: 'Cursos',
      description: 'Aprenda a criar videos virais',
      href: '/dashboard/cursos',
      icon: <MenuBookIcon />,
    },
    // Linha 3: Top Trends e Meu perfil
    {
      title: 'Top Trends',
      description: 'Temas em alta para se inspirar',
      href: '/dashboard/trends',
      icon: <TrendingUpIcon />,
    },
    {
      title: 'Meu Perfil',
      description: 'Edite suas preferências',
      href: '/dashboard/perfil',
      icon: <PersonIcon />,
    },
  ];
}

export function DashboardHome() {
  const theme = useTheme();
  const { account } = useAccount();
  const firstName = account?.first_name?.trim() || '';
  const greeting = firstName ? `Olá, ${firstName}` : 'Olá';
  const cards = getCards();
  const iconBg = alpha(theme.palette.primary.main, 0.1);
  const iconColor = theme.palette.primary.main;

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 600,
          letterSpacing: '-0.02em',
          mb: 0.5,
          background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 35%, #ec4899 100%)',
          backgroundSize: '100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }}
      >
        {greeting}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Por onde você quer começar?
      </Typography>

      <Grid
        container
        spacing={2}
        sx={{
          mx: { xs: 0, sm: 'auto' },
          [theme.breakpoints.down('sm')]: {
            justifyContent: 'center',
          },
        }}
      >
        {cards.map((card) => (
          <Grid
            size={{ xs: 6, sm: 6 }}
            key={card.href}
            sx={{
              display: 'flex',
              minWidth: 0,
              [theme.breakpoints.down('sm')]: {
                flexBasis: 156,
                maxWidth: 156,
                width: 156,
              },
            }}
          >
            <Paper
              component={Link}
              href={card.href}
              elevation={0}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                width: '100%',
                height: { xs: 180, sm: 220 },
                minHeight: { xs: 180, sm: 220 },
                transition: 'all 0.2s ease',
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: theme.shadows[4],
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  '& .dashboard-home-arrow': {
                    transform: 'translateX(4px)',
                  },
                },
              }}
            >
              {/* Área do ícone (como a imagem no card de referência) */}
              <Box
                sx={{
                  height: { xs: 64, sm: 88 },
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: iconBg,
                  '& .MuiSvgIcon-root': { fontSize: { xs: 28, sm: 36 } },
                  color: iconColor,
                }}
              >
                {card.icon}
              </Box>
              {/* Conteúdo: título, descrição, CTA */}
              <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ mb: 0.25, fontSize: '0.9375rem', lineHeight: 1.3 }}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.4,
                    fontSize: '0.8125rem',
                    flex: 1,
                    minHeight: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  {card.description}
                </Typography>
                <Box
                  className="dashboard-home-arrow"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                    mt: 1,
                  }}
                >
                  Acessar
                  <ArrowForwardIcon sx={{ fontSize: 16 }} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
        {/* Evita 1 card sozinho na última linha (só em 2 colunas, sm+) */}
        {cards.length % 2 === 1 && (
          <Grid
            size={{ xs: 6, sm: 6 }}
            sx={{
              display: { xs: 'none', sm: 'block' },
              minWidth: 0,
              [theme.breakpoints.down('sm')]: { flexBasis: 156, maxWidth: 156, width: 156 },
            }}
          />
        )}
      </Grid>
    </Box>
  );
}

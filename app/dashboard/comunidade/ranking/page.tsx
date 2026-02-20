'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { EmojiEvents as TrophyIcon, Leaderboard as LeaderboardIcon } from '@mui/icons-material';
import { useStories } from '@/contexts/StoriesContext';
import { useAccount } from '@/contexts/AccountContext';

export default function RankingPage() {
  const { users, isLoading, error } = useStories();
  const { account } = useAccount();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const userPosition = account?.id ? users.findIndex((u) => u.id === account.id) + 1 : 0;
  const userInRanking = account?.id && userPosition > 0;

  if (!isDesktop) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          O ranking está disponível apenas na versão desktop. Abra no computador para ver.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Erro ao carregar ranking: {error}</Typography>
      </Box>
    );
  }

  const destaque = users[0];
  const ranking = users.slice(0, 10);

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: 'auto',
        py: 3,
        px: 2,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 3 }}>
        <LeaderboardIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700}>
          Ranking da Comunidade
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quem mais interagiu: curtidas dadas, curtidas recebidas, posts e comentários somam os pontos.
      </Typography>

      {/* Destaque atual */}
      {destaque && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: '2px solid',
            borderColor: 'warning.main',
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.warning.main}08 0%, ${theme.palette.warning.dark}12 100%)`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
            <TrophyIcon sx={{ fontSize: 24, color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight={700} color="warning.dark">
              Destaque atual
            </Typography>
          </Stack>
          <Link
            href={`/dashboard/comunidade/perfil/${destaque.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={destaque.avatar || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  border: '3px solid',
                  borderColor: 'warning.main',
                  bgcolor: !destaque.avatar ? 'warning.light' : undefined,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}
              >
                {!destaque.avatar && destaque.initials}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} noWrap>
                  {destaque.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {destaque.interactionCount} pontos
                  {destaque.stats && (
                    <> · {destaque.stats.postsCount} posts · {destaque.stats.likesGiven + destaque.stats.likesReceived} curtidas · {destaque.stats.commentsCount} comentários</>
                  )}
                </Typography>
              </Box>
              <TrophyIcon sx={{ fontSize: 32, color: 'warning.main' }} />
            </Stack>
          </Link>
        </Paper>
      )}

      {/* Lista do ranking */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
        Top 10
      </Typography>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {ranking.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Ninguém no ranking ainda. Interaja no feed para pontuar!</Typography>
          </Box>
        ) : (
          <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
            {ranking.map((user, index) => (
              <Link
                key={user.id}
                href={`/dashboard/comunidade/perfil/${user.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{
                    px: 2,
                    py: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      minWidth: 28,
                      color: index === 0 ? 'warning.main' : 'text.secondary',
                      fontSize: index < 3 ? '1rem' : undefined,
                    }}
                  >
                    #{index + 1}
                  </Typography>
                  <Avatar
                    src={user.avatar || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      border: index === 0 ? '2px solid' : undefined,
                      borderColor: index === 0 ? 'warning.main' : undefined,
                      bgcolor: !user.avatar ? 'primary.main' : undefined,
                      fontSize: '0.875rem',
                    }}
                  >
                    {!user.avatar && user.initials}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={500} noWrap>
                      {user.name}
                    </Typography>
                    {user.stats && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {user.stats.postsCount} posts · {user.stats.likesGiven + user.stats.likesReceived} curtidas · {user.stats.commentsCount} comentários
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {user.interactionCount} pts
                  </Typography>
                </Stack>
              </Link>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Sua posição — embaixo do ranking, discreto */}
      {account?.id && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          {userInRanking ? (
            <>Você está no {userPosition}º lugar</>
          ) : (
            <>Você ainda não está no top 20. Interaja no feed para subir.</>
          )}
        </Typography>
      )}
    </Box>
  );
}

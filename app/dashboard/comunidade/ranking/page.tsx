'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Stack,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Leaderboard as LeaderboardIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  WorkspacePremium as MedalIcon,
} from '@mui/icons-material';
import { useStories } from '@/contexts/StoriesContext';
import { useAccount } from '@/contexts/AccountContext';

interface PastWinner {
  accountId: string;
  name: string;
  avatar: string | null;
  totalWins: number;
  weeks: { weekStart: string; weekEnd: string; score: number }[];
}

export default function RankingPage() {
  const router = useRouter();
  const { users, week, isLoading, error } = useStories();
  const { account } = useAccount();
  const theme = useTheme();
  const [pastWinners, setPastWinners] = useState<PastWinner[]>([]);

  useEffect(() => {
    fetch('/api/accounts/ranking-wins')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPastWinners(data);
      })
      .catch(() => {});
  }, []);

  const userPosition = account?.id ? users.findIndex((u) => u.id === account.id) + 1 : 0;
  const userInRanking = account?.id && userPosition > 0;

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
        pb: { xs: 10, md: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <LeaderboardIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          Ranking da Comunidade
        </Typography>
        <IconButton
          onClick={() => router.back()}
          sx={{ display: { xs: 'flex', md: 'none' } }}
          aria-label="Fechar"
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      {week && (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Semana {week.label}
          </Typography>
        </Stack>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quem mais interagiu esta semana: curtidas dadas, curtidas recebidas, posts e comentários somam os pontos. O ranking reseta toda segunda-feira.
      </Typography>

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
              Destaque da semana
            </Typography>
            {destaque.rankingWins > 0 && (
              <Chip
                icon={<MedalIcon sx={{ fontSize: 16 }} />}
                label={`${destaque.rankingWins}x campeão`}
                size="small"
                sx={{
                  bgcolor: 'warning.light',
                  color: 'warning.dark',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}
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

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
        Top 10 da semana
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
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography variant="body1" fontWeight={500} noWrap>
                        {user.name}
                      </Typography>
                      {user.rankingWins > 0 && (
                        <Chip
                          label={`${user.rankingWins}x`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: 'warning.light',
                            color: 'warning.dark',
                            '& .MuiChip-label': { px: 0.5 },
                          }}
                        />
                      )}
                    </Stack>
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

      {account?.id && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          {userInRanking ? (
            <>Você está no {userPosition}º lugar esta semana</>
          ) : (
            <>Você ainda não está no top 10. Interaja no feed para subir!</>
          )}
        </Typography>
      )}

      {pastWinners.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
            <MedalIcon sx={{ fontSize: 22, color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Hall da Fama
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Campeões semanais e quantas vezes ficaram em 1º lugar.
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
              {pastWinners.map((winner) => (
                <Link
                  key={winner.accountId}
                  href={`/dashboard/comunidade/perfil/${winner.accountId}`}
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
                    <Avatar
                      src={winner.avatar || undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: !winner.avatar ? 'warning.light' : undefined,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      {winner.name?.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={500} noWrap>
                        {winner.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {winner.totalWins}x campeão
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.25}>
                      {Array.from({ length: Math.min(winner.totalWins, 5) }).map((_, i) => (
                        <TrophyIcon key={i} sx={{ fontSize: 18, color: 'warning.main' }} />
                      ))}
                      {winner.totalWins > 5 && (
                        <Typography variant="caption" color="warning.main" fontWeight={700}>
                          +{winner.totalWins - 5}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Link>
              ))}
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

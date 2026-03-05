'use client';

import React, { Suspense, useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Paper,
} from '@mui/material';
import { RocketLaunch as RocketLaunchIcon, LockClock as LockClockIcon } from '@mui/icons-material';
import { CHAT_LAUNCH_DATE } from '@/lib/chat-launch';
import { useAccount } from '@/contexts/AccountContext';
import { Countdown } from '@/components/shared/Countdown';

function getTimeLeft() {
  const now = new Date();
  if (now >= CHAT_LAUNCH_DATE) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const diff = CHAT_LAUNCH_DATE.getTime() - now.getTime();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function ChatPageContent() {
  const { isLoading, canAccessChat, chatUnlockAt } = useAccount();
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const appBar = (
    <AppBar
      position="fixed"
      sx={{
        display: { md: 'none' },
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        boxShadow: 'none',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 2, minHeight: { xs: 56 } }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            IA
          </Avatar>
          <Typography variant="h6" fontWeight="bold" fontSize="1rem">
            Chat IA
          </Typography>
        </Stack>
      </Toolbar>
    </AppBar>
  );

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

  if (!canAccessChat && chatUnlockAt) {
    return (
      <Box sx={{ mt: { xs: '-64px', md: 0 } }}>
        {appBar}
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
              width: '100%',
            }}
          >
            <LockClockIcon sx={{ fontSize: { xs: 44, sm: 56 }, color: 'action.disabled', mb: { xs: 1.5, sm: 2 } }} />
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '1rem', sm: 'inherit' } }}
            >
              Chat com IA
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: 'inherit' }, lineHeight: 1.45, px: { xs: 0.5, sm: 0 } }}
            >
              Essa funcionalidade será liberada para você depois de 7 dias.
            </Typography>
            <Countdown until={chatUnlockAt} />
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: { xs: '-64px', md: 0 } }}>
      {appBar}
      <Box
        sx={{
          maxWidth: 560,
          mx: 'auto',
          px: { xs: 1.5, sm: 3 },
          pt: { xs: 3, sm: 4, md: 6 },
          pb: { xs: 12, sm: 16 },
          minHeight: { xs: 'calc(100vh - 56px)', sm: '60vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            width: '100%',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.06) 0%, transparent 60%)'
                : 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, transparent 60%)',
          }}
        >
          <Box
            sx={{
              width: { xs: 52, sm: 64 },
              height: { xs: 52, sm: 64 },
              mx: 'auto',
              mb: { xs: 1.5, sm: 2 },
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
              color: 'white',
            }}
          >
            <RocketLaunchIcon sx={{ fontSize: { xs: 26, sm: 32 } }} />
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ mb: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' }, px: { xs: 0.5, sm: 0 } }}
          >
            Lançamento em breve
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 360,
              mx: 'auto',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5,
              px: { xs: 0, sm: 0 },
            }}
          >
            A IA treinada pela Nat e pelo Luigi está em preparação. Em breve você poderá criar roteiros, ideias e estratégias conversando direto com a mente deles.
          </Typography>
          <Box sx={{ mt: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {timeLeft.days === 1 ? (
                <Typography
                  sx={{
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    fontWeight: 700,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Amanhã é o dia do lançamento!
                </Typography>
              ) : (
                <>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: { xs: '3rem', sm: '3.75rem' },
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {timeLeft.days}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' }, fontWeight: 500, mt: 0.25 }}>
                    Dias para o lançamento
                  </Typography>
                </>
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{
                mt: 1,
                fontVariantNumeric: 'tabular-nums',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              }}
            >
              {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: 'background.paper',
          }}
        >
          <CircularProgress size={48} />
        </Box>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}

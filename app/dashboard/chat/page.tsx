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
import { RocketLaunch as RocketLaunchIcon } from '@mui/icons-material';
import { CHAT_LAUNCH_DATE } from '@/lib/chat-launch';

function getTimeLeft() {
  const now = new Date();
  if (now >= CHAT_LAUNCH_DATE) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const diff = CHAT_LAUNCH_DATE.getTime() - now.getTime();
  // dias = dias inteiros; hours = total de horas restantes (sempre decrescente)
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor(diff / (1000 * 60 * 60)), // total de horas (ex.: 16 dias = 384h+)
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function ChatPageContent() {
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

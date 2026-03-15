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
  IconButton,
  Button,
} from '@mui/material';
import {
  RocketLaunch as RocketLaunchIcon,
  LockClock as LockClockIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSearchParams, useRouter } from 'next/navigation';
import { CHAT_LAUNCH_DATE, isChatLaunched } from '@/lib/chat-launch';
import { useAccount } from '@/contexts/AccountContext';
import { Countdown } from '@/components/shared/Countdown';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { MOBILE_HEADER_OFFSET } from '@/components/layout/MobileHeaderMui';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation');
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());
  const [hasStarted, setHasStarted] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');

  useEffect(() => {
    if (!isChatLaunched()) {
      const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
      return () => clearInterval(timer);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      setHasStarted(true);
    } else {
      setHasStarted(false);
    }
  }, [conversationId]);

  const handleNewConversation = () => {
    router.push('/dashboard/chat');
  };

  const handleStart = (prompt: string) => {
    if (prompt.trim()) {
      setInitialPrompt(prompt);
      setHasStarted(true);
    }
  };

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
      <Toolbar sx={{ justifyContent: 'space-between', px: 1, minHeight: { xs: 56 } }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            onClick={() => router.push('/dashboard')}
            sx={{ color: 'text.primary' }}
            aria-label="Voltar"
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
              fontSize: '0.65rem',
              fontWeight: 'bold',
            }}
          >
            Dome
          </Avatar>
          <Typography variant="h6" fontWeight="bold" fontSize="1rem">
            Chat com IA
          </Typography>
        </Stack>
      </Toolbar>
    </AppBar>
  );

  const chatHeaderBar = (
    <AppBar
      position="fixed"
      sx={{
        position: { xs: 'fixed', md: 'static' },
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        boxShadow: 'none',
        borderBottom: 1,
        borderColor: 'divider',
        pt: { xs: 'env(safe-area-inset-top, 0px)', md: 0 },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 }, minHeight: { xs: 56 } }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            onClick={() => router.push('/dashboard')}
            sx={{ color: 'text.primary' }}
            aria-label="Voltar"
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold" fontSize="1rem" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Chat com IA
          </Typography>
        </Stack>
        <Button
          startIcon={<AddIcon />}
          onClick={handleNewConversation}
          size="small"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Nova conversa
        </Button>
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

  // Usuário ainda não pode acessar (precisa esperar 7 dias)
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

  // Chat ainda não foi lançado
  if (!isChatLaunched()) {
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
              }}
            >
              Essa IA é o cérebro da Nat e do Luigi. Foi treinada com todo o conhecimento dos cursos e experiências de ambos para te ajudar a criar conteúdo, monetizar nas redes sociais e crescer no digital. Em breve você vai poder conversar diretamente com ela.
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

  // Chat lançado e usuário com acesso — tela inicial com input
  if (!hasStarted) {
    return (
      <Box>
        {appBar}
        <Box
          sx={{
            maxWidth: 720,
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            pt: { xs: 'calc(56px + env(safe-area-inset-top, 0px) + 12px)', sm: 6, md: 10 },
            pb: { xs: 12, sm: 16 },
          }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end', mb: { xs: 2, sm: 3 } }}>
              <Box
                component="button"
                onClick={() => router.push('/dashboard/chat/historico')}
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  bgcolor: 'transparent',
                  border: 'none',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                }}
                title="Ver histórico de conversas"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Box>
            </Box>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                lineHeight: 1.2,
                mb: 1.5,
              }}
            >
              O que vamos criar hoje?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, maxWidth: 480, mx: 'auto', lineHeight: 1.5 }}>
              Essa IA é o cérebro da Nat e do Luigi. Foi treinada com todo o conhecimento dos cursos e experiências de ambos para te ajudar a criar conteúdo, monetizar nas redes sociais e crescer no digital.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const prompt = formData.get('prompt') as string;
              handleStart(prompt);
            }}
            sx={{ maxWidth: 600, mx: 'auto', mb: { xs: 3, sm: 4 } }}
          >
            <Paper
              elevation={3}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: { xs: 0.75, sm: 1 },
                borderRadius: 3,
                border: 2,
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:focus-within': {
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}22`,
                },
              }}
            >
              <Box
                component="input"
                name="prompt"
                placeholder="Crie ideias de conteúdo para Instagram"
                autoFocus
                sx={{
                  flex: 1,
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  outline: 'none',
                  bgcolor: 'transparent',
                  border: 'none',
                  color: 'text.primary',
                  '&::placeholder': { color: 'text.disabled' },
                }}
              />
              <Box
                component="button"
                type="submit"
                sx={{
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                  borderRadius: 2.5,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 1.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Sem ideias? Tente uma destas opções:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
              {[
                'Criar roteiro para Reels',
                'Ideia de post viral',
                'Storytelling pessoal',
                'Conteúdo educativo',
                'Venda sem parecer venda',
              ].map((prompt) => (
                <Box
                  key={prompt}
                  component="button"
                  onClick={() => handleStart(prompt)}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1,
                    bgcolor: 'action.hover',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 5,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    color: 'text.secondary',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: 'action.selected', color: 'text.primary' },
                  }}
                >
                  {prompt}
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  }

  // Chat ativo — interface de conversa com a OpenAI
  // No mobile: header fixo (56px + safe-area), conteúdo começa logo abaixo. No desktop: header no fluxo.
  return (
    <>
      {chatHeaderBar}
      <Box
        sx={{
          maxWidth: 800,
          mx: 'auto',
          px: { xs: 0, sm: 2, md: 3 },
          pt: { xs: MOBILE_HEADER_OFFSET, md: 0 },
          pb: { xs: 2, sm: 2, md: 3 },
          height: {
            xs: 'calc(100vh - 56px - env(safe-area-inset-top, 0px))',
            md: 'calc(100vh - 56px)',
          },
          minHeight: { md: 400 },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChatInterface
          initialPrompt={initialPrompt}
          conversationId={conversationId || undefined}
          onNewConversation={handleNewConversation}
        />
      </Box>
    </>
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

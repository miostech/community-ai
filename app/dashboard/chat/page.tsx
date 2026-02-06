'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useSearchParams, useRouter } from 'next/navigation';

// MUI imports
import {
  AppBar,
  Toolbar,
  Avatar,
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Paper,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  History as HistoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const suggestionPrompts = [
  'Criar roteiro para Reels',
  'Ideia de post viral',
  'Storytelling pessoal',
  'Conteúdo educativo',
  'Venda sem parecer venda',
];

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation');
  const [hasStarted, setHasStarted] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (conversationId) {
      setHasStarted(true);
    }
  }, [conversationId]);

  const handleStart = (prompt: string) => {
    if (prompt.trim()) {
      setInitialPrompt(prompt);
      setHasStarted(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleStart(inputValue);
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
        <Stack direction="row" spacing={0.5}>
          {hasStarted && (
            <IconButton
              onClick={() => {
                setHasStarted(false);
                setInitialPrompt('');
                router.push('/dashboard/chat');
              }}
              sx={{ color: 'text.primary' }}
              title="Nova conversa"
            >
              <AddIcon />
            </IconButton>
          )}
          <IconButton
            onClick={() => router.push('/dashboard/chat/historico')}
            sx={{ color: 'text.primary' }}
            title="Histórico"
          >
            <HistoryIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );

  if (!hasStarted) {
    return (
      <Box sx={{ mt: { xs: '-64px', md: 0 } }}>
        {appBar}
        <Box
          sx={{
            maxWidth: 1000,
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 4, md: 6 },
            pb: { xs: 10, sm: 16 },
          }}
        >
          {/* Main content */}
          <Box sx={{ textAlign: 'center' }}>
            <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 4, sm: 6 }, mt: { xs: 12, sm: 12 } }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem', lg: '3.25rem' },
                  lineHeight: 1.2,
                  px: 1,
                }}
              >
                O que vamos criar hoje?
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Converse com a IA treinada pela{' '}
                <Typography component="span" fontWeight={600} color="text.primary">
                  Nat
                </Typography>{' '}
                e o{' '}
                <Typography component="span" fontWeight={600} color="text.primary">
                  Luigi
                </Typography>
              </Typography>
            </Stack>

            {/* Input form */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                maxWidth: 720,
                mx: 'auto',
                mt: { xs: 4, sm: 6 },
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: { xs: 0.75, sm: 1 },
                  borderRadius: { xs: 2, sm: 3 },
                  border: 2,
                  borderColor: 'divider',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'text.disabled',
                  },
                  '&:focus-within': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 0 0 4px ${theme.palette.primary.main}20`,
                  },
                }}
              >
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="Crie ideias de conteúdo para Instagram"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      px: { xs: 1.5, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '1rem', md: '1.125rem' },
                    },
                  }}
                />
                <IconButton
                  type="submit"
                  disabled={!inputValue.trim()}
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: { xs: 1.5, sm: 2 },
                    flexShrink: 0,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '&:disabled': {
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled',
                    },
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Paper>
            </Box>

            {/* Suggestions */}
            <Box sx={{ mt: { xs: 3, sm: 4 } }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: { xs: 1.5, sm: 2 } }}
              >
                Sem ideias? Tente uma destas opções:
              </Typography>
              <Stack
                direction="row"
                flexWrap="wrap"
                justifyContent="center"
                sx={{ gap: 1, px: 2 }}
              >
                {suggestionPrompts.map((prompt, index) => (
                  <Chip
                    key={index}
                    label={prompt}
                    onClick={() => handleStart(prompt)}
                    variant="outlined"
                    sx={{
                      borderRadius: 5,
                      px: 0.5,
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      height: { xs: 28, sm: 32 },
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'text.secondary',
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const handleNewConversation = () => {
    setHasStarted(false);
    setInitialPrompt('');
    router.push('/dashboard/chat');
  };

  return (
    <Box sx={{ mt: { xs: '-64px', md: 0 } }}>
      {appBar}
      <Box
        sx={{
          maxWidth: 896,
          mx: 'auto',
          px: { xs: 0, sm: 2, md: 3 },
          py: { xs: 0, sm: 2, md: 3, lg: 4 },
          pb: { xs: 'calc(56px + env(safe-area-inset-bottom))', md: 0 },
          height: "100%",
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', height: { xs: '100%', sm: 'auto' } }}>
          <ChatInterface
            initialPrompt={initialPrompt}
            conversationId={conversationId || undefined}
            onNewConversation={handleNewConversation}
          />
        </Box>
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

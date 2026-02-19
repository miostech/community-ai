'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { isChatLaunched } from '@/lib/chat-launch';

// MUI imports
import {
  AppBar,
  Box,
  Typography,
  TextField,
  Toolbar,
  IconButton,
  Button,
  Paper,
  InputAdornment,
  Stack,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  ChatBubble as ChatBubbleIcon,
  TextsmsOutlined as ChatBubbleOutlineIcon,
} from '@mui/icons-material';

interface ConversationItem {
  _id: string;
  title: string;
  summary?: string;
  model: string;
  total_tokens_in: number;
  total_tokens_out: number;
  message_count: number;
  preview: string;
  created_at: string;
  updated_at: string;
}

export default function HistoricoPage() {
  const { user } = useUser();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) throw new Error('Erro ao buscar conversas');
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Área indisponível até o lançamento do chat — redireciona para o chat
  useEffect(() => {
    if (!isChatLaunched()) {
      router.replace('/dashboard/chat');
    }
  }, [router]);

  if (!isChatLaunched()) {
    return null; // evita flash da página antes do redirect
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenConversation = (conversationId: string) => {
    router.push(`/dashboard/chat?conversation=${conversationId}`);
  };

  const handleNewChat = () => {
    router.push('/dashboard/chat');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

    try {
      const res = await fetch(`/api/chat/${conversationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Hoje';
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} atrás`;
    } else {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: 672,
          width: '100%',
          pb: { xs: 12, sm: 4 },
          bgcolor: 'background.paper',
          minHeight: '100vh',
        }}
      >
        {/* Header Fixo */}
        <AppBar
          position="fixed"
          sx={{
            width: { xs: '100%', md: 'calc(100% - 256px)' },
          }}
        >
          <Box sx={{ maxWidth: 672, mx: 'auto', width: '100%' }}>
            <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  onClick={() => router.push('/dashboard/chat')}
                  edge="start"
                  sx={{ color: 'text.primary' }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="bold">
                  Histórico
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
              </Typography>
            </Toolbar>
          </Box>
        </AppBar>

        {/* Search — pt para não ficar atrás do header fixo */}
        <Box sx={{ px: 2, pt: 9, pb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.paper',
              },
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ px: 2 }}>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Carregando conversas...
              </Typography>
            </Box>
          ) : filteredConversations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'action.hover',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm
                  ? 'Tente buscar com outros termos'
                  : 'Comece uma nova conversa com a IA para criar seu primeiro histórico'}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  onClick={handleNewChat}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    fontWeight: 500,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    },
                  }}
                >
                  Iniciar Conversa
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={2}>
              {filteredConversations.map((conversation) => (
                <Paper
                  key={conversation._id}
                  onClick={() => handleOpenConversation(conversation._id)}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    border: 2,
                    borderColor: 'divider',
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: 3,
                      '& .conversation-title': {
                        color: 'primary.main',
                      },
                    },
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            borderRadius: 2,
                          }}
                        >
                          <ChatBubbleIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            className="conversation-title"
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              transition: 'color 0.15s ease-in-out',
                            }}
                          >
                            {conversation.title}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            divider={
                              <Typography variant="caption" color="text.disabled">
                                •
                              </Typography>
                            }
                          >
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(new Date(conversation.updated_at))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {conversation.message_count}{' '}
                              {conversation.message_count === 1 ? 'mensagem' : 'mensagens'}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          ml: 6.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {conversation.preview}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={(e) => handleDeleteConversation(e, conversation._id)}
                      size="small"
                      title="Excluir conversa"
                      sx={{
                        color: 'text.disabled',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.08)',
                          color: 'error.main',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}

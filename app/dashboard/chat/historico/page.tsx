'use client';

import React, { useState } from 'react';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

// MUI imports
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Paper,
  InputAdornment,
  Stack,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  ChatBubble as ChatBubbleIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
} from '@mui/icons-material';

export default function HistoricoPage() {
  const { conversations, deleteConversation, setCurrentConversationId } = useChatHistory();
  const { user } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    router.push(`/dashboard/chat?conversation=${conversationId}`);
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    router.push('/dashboard/chat');
  };

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      deleteConversation(conversationId);
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

  const getPreview = (conversation: any) => {
    const firstUserMessage = conversation.messages.find((msg: any) => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.length > 100
        ? firstUserMessage.content.substring(0, 100) + '...'
        : firstUserMessage.content;
    }
    return 'Nova conversa';
  };

  return (
    <Box
      sx={{
        maxWidth: 1152,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 4 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.push('/dashboard/chat')}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ fontSize: { xs: '1.5rem', sm: '1.875rem' } }}
            >
              Histórico de Conversas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'} salvas
            </Typography>
          </Box>
        </Stack>

        {/* Search */}
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
      {filteredConversations.length === 0 ? (
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
              key={conversation.id}
              onClick={() => handleOpenConversation(conversation.id)}
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
                          {formatDate(conversation.updatedAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {conversation.messages.length}{' '}
                          {conversation.messages.length === 1 ? 'mensagem' : 'mensagens'}
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
                    {getPreview(conversation)}
                  </Typography>
                </Box>
                <IconButton
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                  size="small"
                  title="Excluir conversa"
                  sx={{
                    color: 'text.disabled',
                    '&:hover': {
                      bgcolor: 'error.main',
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
  );
}

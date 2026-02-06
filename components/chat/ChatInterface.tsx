'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

import {
  Typography,
  IconButton,
  Avatar,
  Stack,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  ArrowForward as SendIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  initialContent?: {
    hook: string;
    development: string;
    cta: string;
  };
  initialPrompt?: string;
  conversationId?: string;
  onNewConversation?: () => void;
}

export function ChatInterface({ initialContent, initialPrompt, conversationId, onNewConversation }: ChatInterfaceProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const hasInitializedRef = useRef(false);
  const apiConversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Buscar mensagens de uma conversa existente da API
  const loadConversationFromApi = useCallback(async (convId: string) => {
    setLoadingConversation(true);
    try {
      const res = await fetch(`/api/chat/${convId}?limit=50`);
      if (!res.ok) throw new Error('Erro ao carregar conversa');
      const data = await res.json();

      apiConversationIdRef.current = convId;

      const loadedMessages: Message[] = data.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      }));

      setMessages(loadedMessages);
    } catch (err) {
      console.error('Erro ao carregar conversa:', err);
      const errorMsg: Message = {
        id: 'error',
        role: 'assistant',
        content: '❌ Não foi possível carregar a conversa. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages([errorMsg]);
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Se veio um conversationId (do histórico), carregar da API
    if (conversationId) {
      loadConversationFromApi(conversationId);
      return;
    }

    if (initialContent) {
      const initialMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Oi, ${user.name}! 👋\n\n✨ Sou a **IA treinada pessoalmente pela Nat e pelo Luigi** para te ajudar a criar conteúdo que viraliza e converte! 🚀\n\nAnalisei seu pedido usando as estratégias que levaram eles a milhões de seguidores. Aqui está o resultado:\n\n**🎯 Hook:**\n${initialContent.hook}\n\n**📖 Desenvolvimento:**\n${initialContent.development}\n\n**💥 CTA:**\n${initialContent.cta}\n\n💬 Como posso ajudar mais? Posso:\n• Melhorar qualquer parte\n• Adaptar para outra rede social\n• Adicionar storytelling\n• Tornar mais persuasivo\n\nTudo com o conhecimento da Nat e do Luigi! 💪`,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    } else if (initialPrompt) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialPrompt,
        timestamp: new Date(),
      };
      setMessages([userMessage]);
      setIsLoading(true);

      sendToApi(initialPrompt).catch(() => {
        setIsLoading(false);
      });
    } else {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Oi, ${user.name}! 👋\n\n✨ Eu sou a **IA treinada pela Nat e pelo Luigi** para te ajudar a criar conteúdo que viraliza! 🚀\n\n**Quem me treinou:**\n• Natália Trombelli - milhões de seguidores no Instagram\n• Luigi Andersen - especialista em conteúdo viral\n\n**O que posso fazer por você:**\n✨ Criar roteiros completos do zero\n💡 Gerar ideias de conteúdo virais\n📱 Adaptar conteúdo para cada rede social\n🎯 Criar hooks que prendem atenção\n💥 CTAs que convertem de verdade\n📖 Adicionar storytelling que conecta\n\nEstou aqui 24/7 para aplicar as estratégias da Nat e do Luigi na sua criação de conteúdo!\n\n🔥 O que vamos criar hoje?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToApi = async (content: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversation_id: apiConversationIdRef.current,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao enviar mensagem');
      }

      const data = await res.json();

      // Guardar o conversation_id para próximas mensagens
      if (data.conversation_id) {
        apiConversationIdRef.current = data.conversation_id;
      }

      const assistantMessage: Message = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.created_at),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Erro no chat:', err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    await sendToApi(currentInput);
  };



  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mt: { xs: 7, sm: 0 },
        height: { xs: 'calc(100dvh - 56px - 56px - env(safe-area-inset-bottom))', sm: 'auto' },
        minHeight: { xs: 'calc(100dvh - 56px - 56px - env(safe-area-inset-bottom))' },
        bgcolor: 'background.paper',
        overflow: 'hidden',
        borderRadius: { sm: 3 },
        border: { sm: 1 },
        borderColor: { sm: 'divider' },
        boxShadow: { sm: 1 },
        maxHeight: { sm: 600 },
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2, sm: 2.5, md: 3 },
          pt: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 10, sm: 2.5, md: 3 },
        }}
      >
        {loadingConversation ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Stack spacing={2} alignItems="center">
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary">
                Carregando conversa...
              </Typography>
            </Stack>
          </Box>
        ) : (
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {messages.map((message) => (
            <Stack
              key={message.id}
              direction="row"
              spacing={1}
              justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
              alignItems="flex-start"
            >
              {message.role === 'assistant' && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  IA
                </Avatar>
              )}
              <Box
                sx={{
                  maxWidth: '80%',
                  borderRadius: 3,
                  px: 2,
                  py: 1.5,
                  ...(message.role === 'user'
                    ? {
                      background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                      color: 'white',
                    }
                    : {
                      bgcolor: 'action.hover',
                      color: 'text.primary',
                      border: 1,
                      borderColor: 'divider',
                    }),
                }}
              >
                {message.role === 'user' ? (
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.7,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    {message.content}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      lineHeight: 1.7,
                      wordBreak: 'break-word',
                      '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
                      '& strong': { fontWeight: 700 },
                      '& h1, & h2, & h3': {
                        fontSize: '1rem',
                        fontWeight: 700,
                        mt: 1.5,
                        mb: 0.5,
                        '&:first-of-type': { mt: 0 },
                      },
                      '& ul, & ol': { pl: 2.5, my: 0.5 },
                      '& li': { mb: 0.3 },
                      '& code': {
                        bgcolor: 'action.selected',
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontSize: '0.8em',
                        fontFamily: 'monospace',
                      },
                      '& pre': {
                        bgcolor: 'action.selected',
                        p: 1.5,
                        borderRadius: 1,
                        overflow: 'auto',
                        my: 1,
                        '& code': { bgcolor: 'transparent', p: 0 },
                      },
                      '& hr': { my: 1, borderColor: 'divider' },
                      '& blockquote': {
                        borderLeft: 3,
                        borderColor: 'primary.main',
                        pl: 1.5,
                        ml: 0,
                        fontStyle: 'italic',
                        opacity: 0.85,
                      },
                    }}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </Box>
                )}
              </Box>
              {message.role === 'user' && (
                user.avatar ? (
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                )
              )}
            </Stack>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                IA
              </Avatar>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 3,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Stack direction="row" spacing={0.5}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: i % 2 === 0 ? '#3b82f6' : '#9333ea',
                        '@keyframes bounce': {
                          '0%, 100%': { transform: 'translateY(0)' },
                          '50%': { transform: 'translateY(-6px)' },
                        },
                        animation: `bounce 0.6s ease-in-out ${delay}s infinite`,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
          <div ref={messagesEndRef} />
        </Stack>
        )}
      </Box>

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          pb: { xs: 1, sm: 0 },
          flexShrink: 0,
          bgcolor: 'background.paper',
          position: { xs: 'fixed', sm: 'static' },
          bottom: { xs: 'calc(56px + env(safe-area-inset-bottom))' },
          left: { xs: 0 },
          right: { xs: 0 },
          zIndex: { xs: 40 },
        }}
      >
        <TextField
          inputRef={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Digite aqui..."
          multiline
          maxRows={4}
          fullWidth
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  sx={{
                    width: 36,
                    height: 36,
                    ...(!input.trim() || isLoading
                      ? { bgcolor: 'action.disabledBackground' }
                      : {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        },
                      }),
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'background.default',
              fontSize: '1rem',
              py: 0.5
            },
          }}
        />
      </Box>
    </Box>
  );
}

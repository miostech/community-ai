'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useChatHistory, Message } from '@/contexts/ChatHistoryContext';

import {
  Typography,
  IconButton,
  Avatar,
  Stack,
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ArrowForward as SendIcon,
} from '@mui/icons-material';

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
  const {
    saveConversation,
    updateConversation,
    currentConversationId,
    setCurrentConversationId,
    loadConversation
  } = useChatHistory();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (hasInitialized) return;

    if (initialContent) {
      // Mensagem inicial da IA
      const initialMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Oi, ${user.name}! 👋\n\n✨ Sou a **IA treinada pessoalmente pela Nat e pelo Luigi** para te ajudar a criar conteúdo que viraliza e converte! 🚀\n\nAnalisei seu pedido usando as estratégias que levaram eles a milhões de seguidores. Aqui está o resultado:\n\n**🎯 Hook:**\n${initialContent.hook}\n\n**📖 Desenvolvimento:**\n${initialContent.development}\n\n**💥 CTA:**\n${initialContent.cta}\n\n💬 Como posso ajudar mais? Posso:\n• Melhorar qualquer parte\n• Adaptar para outra rede social\n• Adicionar storytelling\n• Tornar mais persuasivo\n\nTudo com o conhecimento da Nat e do Luigi! 💪`,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      setHasInitialized(true);
    } else if (initialPrompt) {
      // Se houver um prompt inicial, enviar automaticamente
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialPrompt,
        timestamp: new Date(),
      };
      setMessages([userMessage]);
      setIsLoading(true);
      setHasInitialized(true);

      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateResponse(initialPrompt, initialContent, user.name),
          timestamp: new Date(),
        };
        setMessages([userMessage, assistantMessage]);
        setIsLoading(false);
      }, 1500);
    } else {
      // Mensagem de boas-vindas quando não há prompt inicial
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Oi, ${user.name}! 👋\n\n✨ Eu sou a **IA treinada pela Nat e pelo Luigi** para te ajudar a criar conteúdo que viraliza! 🚀\n\n**Quem me treinou:**\n• Natália Trombelli - milhões de seguidores no Instagram\n• Luigi Andersen - especialista em conteúdo viral\n\n**O que posso fazer por você:**\n✨ Criar roteiros completos do zero\n💡 Gerar ideias de conteúdo virais\n📱 Adaptar conteúdo para cada rede social\n🎯 Criar hooks que prendem atenção\n💥 CTAs que convertem de verdade\n📖 Adicionar storytelling que conecta\n\nEstou aqui 24/7 para aplicar as estratégias da Nat e do Luigi na sua criação de conteúdo!\n\n🔥 O que vamos criar hoje?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setHasInitialized(true);
    }
  }, [initialContent, initialPrompt, hasInitialized, user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Salvar automaticamente as mensagens
  useEffect(() => {
    if (messages.length > 0 && hasInitialized) {
      if (currentConversationId) {
        updateConversation(currentConversationId, messages);
      } else {
        saveConversation(messages);
      }
    }
  }, [messages, hasInitialized]);

  // Carregar conversa existente se houver conversationId
  useEffect(() => {
    if (conversationId && !hasInitialized) {
      const conversation = loadConversation(conversationId);
      if (conversation) {
        setMessages(conversation.messages);
        setCurrentConversationId(conversationId);
        setHasInitialized(true);
      }
    }
  }, [conversationId]);

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
    setInput('');
    setIsLoading(true);

    // Simular resposta da IA
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input, initialContent, user.name),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
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
              py: 0.5,
              height: 48
            },
          }}
        />
      </Box>
    </Box>
  );
}

// Função para gerar respostas simuladas (em produção, chamaria API real)
function generateResponse(userInput: string, initialContent?: any, userName?: string): string {
  const lowerInput = userInput.toLowerCase();
  const greeting = userName ? `${userName}` : 'Vamos lá';

  if (lowerInput.includes('melhor') || lowerInput.includes('melhore')) {
    return `✨ Ótima escolha, ${greeting}!\n\nAqui está uma versão melhorada usando a técnica de "hook curioso" que a Nat sempre usa:\n\n🎯 **Hook melhorado:**\n"Você já percebeu como o conteúdo que consome diariamente está moldando suas decisões sem você nem notar?"\n\n💡 **Por que funciona:**\n• Cria curiosidade imediata\n• Usa "você" para conexão direta\n• Questão que faz pensar\n\nEssa é uma das técnicas favoritas do Luigi para prender atenção nos primeiros 3 segundos!\n\nQuer que eu ajuste mais alguma coisa?`;
  }

  if (lowerInput.includes('encurt') || lowerInput.includes('curt')) {
    return `📱 Perfeito, ${greeting}! Vou usar a regra dos "90 caracteres" da Nat:\n\n✂️ **Versão encurtada:**\n"Estamos sendo influenciados o tempo todo. Quando você entende isso, pode criar conteúdo que realmente impacta."\n\n🎯 **O que fiz:**\n• Reduzi de 2 parágrafos para 2 frases diretas\n• Mantive a essência da mensagem\n• Deixei mais fácil de ler no mobile\n\nEssa versão segue o método "fast content" que o Luigi usa para TikTok e Reels!\n\nFicou do jeito que você queria?`;
  }

  if (lowerInput.includes('tiktok') || lowerInput.includes('adapt')) {
    return `🎬 Show, ${greeting}! Vou adaptar usando o framework de vídeos curtos da Nat:\n\n**⚡ Hook (primeiros 3 seg):**\n"POV: você descobrindo que TODO conteúdo que você vê está te influenciando"\n\n**📖 Desenvolvimento (7-15 seg):**\n"Mas calma, isso não é ruim! Quando você entende como funciona, você pode criar conteúdo que realmente ajuda as pessoas."\n\n**💥 CTA (últimos 3 seg):**\n"Salva esse vídeo e me conta: qual foi o último conteúdo que mudou sua cabeça?"\n\n🔥 **Dicas extras da Nat:**\n• Use texto na tela para o hook\n• Fale olhando na câmera\n• Trending sounds aumentam alcance\n\nPronto para gravar? 🚀`;
  }

  if (lowerInput.includes('cta') || lowerInput.includes('persuasiv')) {
    return `💥 Vamos turbinar esse CTA, ${greeting}!\n\nAqui está usando a técnica de "engajamento ativo" que o Luigi ensina:\n\n**🎯 CTA mais persuasivo:**\n"Compartilhe nos comentários qual foi o último conteúdo que mudou sua perspectiva - vou ler CADA resposta e responder as melhores!"\n\n✨ **Por que funciona:**\n✅ Cria senso de urgência (vou ler CADA)\n✅ Promessa de interação (vou responder)\n✅ Uso de CAPS para ênfase\n✅ Recompensa social (as melhores)\n\nEsse é o estilo que a Nat usa e que gera +300% mais comentários!\n\nQuer testar outra variação ainda mais forte?`;
  }

  if (lowerInput.includes('storytelling') || lowerInput.includes('história')) {
    return `📖 Excelente, ${greeting}! O storytelling é a especialidade da Nat!\n\nAqui está usando a estrutura "Antes → Descoberta → Depois → Convite":\n\n**🎬 Versão com storytelling:**\n\n**Hook:**\n"Eu estava criando conteúdo há 3 anos quando percebi algo que mudou tudo..."\n\n**Desenvolvimento:**\n"Descobri que estávamos sendo influenciados o tempo todo, sem perceber. Foi quando entendi que, ao invés de apenas consumir, eu poderia criar conteúdo que realmente impactasse a vida das pessoas de forma positiva. Hoje, cada post que crio tem esse propósito."\n\n**CTA:**\n"Qual foi o momento que mudou sua perspectiva sobre criar conteúdo? Conta aqui nos comentários!"\n\n💡 **O que adicionei:**\n• Narrativa pessoal (cria conexão)\n• Vulnerabilidade ("percebi algo")\n• Transformação clara\n• Convite à reflexão\n\nEssa é a fórmula que a Nat usa em posts que geram milhões de views!\n\nQuer adicionar mais algum elemento emocional?`;
  }

  if (lowerInput.includes('instagram') || lowerInput.includes('insta')) {
    return `📸 Beleza, ${greeting}! Vou adaptar para o Instagram usando as técnicas da Nat:\n\n**🎯 Para Feed:**\n• Primeira frase deve ser impactante\n• Use quebras de linha (aumenta leitura)\n• Máximo 3 hashtags (parece mais orgânico)\n• Foto com texto overlay\n\n**📱 Para Reels:**\n• Hook nos primeiros 1-2 segundos\n• Legendas grandes e fáceis de ler\n• Música trending\n• CTA no fim do vídeo\n\n**💬 Para Stories:**\n• Use adesivos de enquete\n• Caixinha de perguntas\n• "Arrasta pra cima" mental\n\nQual formato você quer que eu desenvolva melhor?`;
  }

  if (lowerInput.includes('viral') || lowerInput.includes('viralizar')) {
    return `🚀 Opa, ${greeting}! Vou te passar a fórmula de conteúdo viral que o Luigi usa:\n\n**🔥 Os 5 elementos do conteúdo viral:**\n\n1️⃣ **Hook inesperado** - surpreenda nos primeiros 3 seg\n2️⃣ **Valor rápido** - entregue algo útil logo\n3️⃣ **Emoção forte** - raiva, alegria ou surpresa\n4️⃣ **Identificação** - "isso é tão eu"\n5️⃣ **Compartilhável** - fácil de marcar amigos\n\n💡 **Tópicos que viralizam mais:**\n• Transformações (antes/depois)\n• Revelações (eu descobri que...)\n• Controvérsias (opinião forte)\n• Tutoriais rápidos (em 30 seg)\n\n🎯 **Dica da Nat:**\nConteúdo viral = 20% técnica + 80% timing\nPoste quando seu público está online!\n\nQuer que eu crie um conteúdo viral do zero pra você?`;
  }

  if (lowerInput.includes('ajuda') || lowerInput.includes('dúvida') || lowerInput.includes('não sei')) {
    return `Relaxa, ${greeting}! Estou aqui pra isso! 😊\n\n✨ **Como posso te ajudar melhor:**\n\nMe conte:\n• Que tipo de conteúdo você quer criar?\n• Para qual rede social?\n• Qual seu objetivo? (engajamento, venda, autoridade)\n• Tem algum exemplo que você gosta?\n\n💡 **Ou escolha um desses:**\n• "Crie um roteiro viral para TikTok"\n• "Me dê 10 ideias de conteúdo"\n• "Adapte isso para Instagram"\n• "Melhore meu gancho"\n\nVamos criar juntos usando tudo que a Nat e o Luigi me ensinaram! 🚀`;
  }

  // Resposta genérica mais interativa
  return `Entendi, ${greeting}! 👋\n\n✨ Como **IA treinada pessoalmente pela Nat e pelo Luigi**, posso fazer muito por você:\n\n**🎯 Criação de conteúdo:**\n• Roteiros completos (hook + desenvolvimento + CTA)\n• Ideias virais para qualquer nicho\n• Adaptação entre redes sociais\n\n**📱 Otimização:**\n• Melhorar hooks para prender atenção\n• CTAs que convertem\n• Adicionar storytelling\n• Encurtar/expandir textos\n\n**💡 Estratégia:**\n• Análise de conteúdo\n• Sugestões de trending topics\n• Timing de postagem\n\n🔥 **Fala pra mim:**\nO que você quer criar agora? Pode ser específico ou me perguntar qualquer coisa sobre estratégia de conteúdo!\n\nEstou aqui 24/7 usando o conhecimento da Nat e do Luigi pra te ajudar! 💪`;
}

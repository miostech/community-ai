'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/contexts/UserContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialContent?: {
    hook: string;
    development: string;
    cta: string;
  };
  initialPrompt?: string;
}

export function ChatInterface({ initialContent, initialPrompt }: ChatInterfaceProps) {
  const { user } = useUser();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    'Melhore o hook',
    'Encurte o desenvolvimento',
    'Adapte para TikTok',
    'Torne o CTA mais persuasivo',
    'Adicione mais storytelling',
  ];

  return (
    <div className="flex flex-col h-full sm:h-[calc(100vh-220px)] md:h-[600px] sm:max-h-[600px] bg-white sm:bg-white/80 sm:backdrop-blur-sm sm:rounded-xl sm:border sm:border-gray-100 sm:shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 md:gap-4 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-2 ring-blue-200">
                <span className="text-white font-bold text-xs sm:text-sm">IA</span>
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                  : 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-900 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
                {message.content}
              </div>
            </div>
            {message.role === 'user' && (
              <>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-[10px] sm:text-xs">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 sm:gap-3 md:gap-4 justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-2 ring-blue-200 animate-pulse">
              <span className="text-white font-bold text-xs sm:text-sm">IA</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length > 0 && messages.length < 3 && (
        <div className="px-3 sm:px-4 md:px-6 pb-2 overflow-x-auto">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-max">
            {suggestedPrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(prompt);
                  textareaRef.current?.focus();
                }}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-gray-700 transition-colors whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 sm:p-4">
        <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32 bg-white text-sm sm:text-base"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '40px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              style={
                !input.trim() || isLoading
                  ? {}
                  : {
                      background: 'linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))',
                    }
              }
              onMouseEnter={(e) => {
                if (!(!input.trim() || isLoading)) {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(29 78 216), rgb(126 34 206))';
                }
              }}
              onMouseLeave={(e) => {
                if (!(!input.trim() || isLoading)) {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))';
                }
              }}
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
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

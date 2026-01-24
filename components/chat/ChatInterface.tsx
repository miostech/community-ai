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
        content: `Criei seu conteúdo! Aqui está o resultado:\n\n**Hook:**\n${initialContent.hook}\n\n**Desenvolvimento:**\n${initialContent.development}\n\n**CTA:**\n${initialContent.cta}\n\nComo posso ajudar? Posso melhorar alguma parte, adaptar para outra rede, encurtar, ou responder qualquer dúvida sobre o conteúdo.`,
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
          content: generateResponse(initialPrompt, initialContent),
          timestamp: new Date(),
        };
        setMessages([userMessage, assistantMessage]);
        setIsLoading(false);
      }, 1500);
    }
  }, [initialContent, initialPrompt, hasInitialized]);

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
        content: generateResponse(input, initialContent),
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
    <div className="flex flex-col h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)] md:h-[600px] max-h-[600px] bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
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
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
function generateResponse(userInput: string, initialContent?: any): string {
  const lowerInput = userInput.toLowerCase();

  if (lowerInput.includes('melhor') || lowerInput.includes('melhore')) {
    return `Aqui está uma versão melhorada do hook:\n\n"Você já percebeu como o conteúdo que consome diariamente está moldando suas decisões sem você nem notar?"\n\nEsta versão é mais direta e cria uma conexão imediata com o leitor. Quer que eu ajuste mais alguma coisa?`;
  }

  if (lowerInput.includes('encurt') || lowerInput.includes('curt')) {
    return `Versão encurtada do desenvolvimento:\n\n"Estamos constantemente sendo influenciados. Quando você entende isso, pode criar conteúdo que realmente impacta a vida das pessoas de forma positiva."\n\nReduzi de 2 parágrafos para 2 frases, mantendo a essência. Funciona melhor para redes sociais!`;
  }

  if (lowerInput.includes('tiktok') || lowerInput.includes('adapt')) {
    return `Versão adaptada para TikTok:\n\n**Hook (primeiros 3 segundos):**\n"POV: você descobrindo que TODO conteúdo que você vê está te influenciando"\n\n**Desenvolvimento:**\n"Mas calma, isso não é ruim! Quando você entende como funciona, você pode criar conteúdo que realmente ajuda as pessoas."\n\n**CTA:**\n"Salva esse vídeo e me conta: qual foi o último conteúdo que mudou sua cabeça?"\n\nAdaptei para ser mais visual e direto, perfeito para TikTok!`;
  }

  if (lowerInput.includes('cta') || lowerInput.includes('persuasiv')) {
    return `CTA mais persuasivo:\n\n"Compartilhe nos comentários qual foi o último conteúdo que mudou sua perspectiva - vou ler cada resposta!"\n\nEsta versão:\n- Cria urgência (vou ler cada resposta)\n- É mais pessoal\n- Incentiva ação imediata\n\nQuer testar outra variação?`;
  }

  if (lowerInput.includes('storytelling') || lowerInput.includes('história')) {
    return `Versão com storytelling:\n\n**Hook:**\n"Eu estava criando conteúdo há 3 anos quando percebi algo que mudou tudo..."\n\n**Desenvolvimento:**\n"Descobri que estávamos sendo influenciados o tempo todo, sem perceber. Foi quando entendi que, ao invés de apenas consumir, eu poderia criar conteúdo que realmente impactasse a vida das pessoas de forma positiva. Hoje, cada post que crio tem esse propósito."\n\n**CTA:**\n"Qual foi o momento que mudou sua perspectiva sobre criar conteúdo? Conta aqui nos comentários!"\n\nAdicionei uma narrativa pessoal que cria conexão emocional. Quer ajustar algo?`;
  }

  // Resposta genérica
  return `Entendi! Posso ajudar você a:\n\n• Melhorar qualquer parte do conteúdo\n• Adaptar para outras redes sociais\n• Encurtar ou expandir textos\n• Adicionar storytelling\n• Tornar mais persuasivo\n• Responder dúvidas sobre estratégia\n\nO que você gostaria de fazer agora?`;
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useSearchParams, useRouter } from 'next/navigation';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation');
  const [hasStarted, setHasStarted] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');

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

  if (!hasStarted) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 md:pt-12 pb-20 sm:pb-32">
        <div className="flex justify-end mb-8 sm:mb-12">
          <button
            onClick={() => router.push('/dashboard/chat/historico')}
            className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Ver histórico de conversas"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        <div className="text-center space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight px-2">
              O que vamos criar hoje?
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-400 mt-2">
              Converse com a IA treinada pela <span className="font-semibold text-gray-900 dark:text-white">Nat</span> e o <span className="font-semibold text-gray-900 dark:text-white">Luigi</span>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const prompt = formData.get('prompt') as string;
              handleStart(prompt);
            }}
            className="max-w-3xl mx-auto mt-8 sm:mt-12"
          >
            <div className="relative flex items-center bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg hover:border-gray-300 dark:hover:border-neutral-600 transition-all focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:shadow-xl">
              <input
                type="text"
                name="prompt"
                placeholder="Crie ideias de conteúdo para Instagram"
                className="flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg outline-none bg-transparent text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
                autoFocus
              />
              <button
                type="submit"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shadow-md hover:shadow-lg flex-shrink-0"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </form>

          <div className="mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mb-2 sm:mb-3">Sem ideias? Tente uma destas opções:</p>
            <div className="flex flex-wrap items-center justify-center gap-2 px-4">
              {[
                'Criar roteiro para Reels',
                'Ideia de post viral',
                'Storytelling pessoal',
                'Conteúdo educativo',
                'Venda sem parecer venda',
              ].map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleStart(prompt)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-full text-xs sm:text-sm text-gray-700 dark:text-neutral-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4 md:px-6 py-0 sm:py-4 md:py-6 lg:py-8 h-[calc(100vh-4rem)] sm:h-auto">
      <div className="w-full h-full sm:h-auto">
        <ChatInterface 
          initialPrompt={initialPrompt} 
          conversationId={conversationId || undefined}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

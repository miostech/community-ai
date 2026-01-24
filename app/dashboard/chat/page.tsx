'use client';

import React, { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');

  const handleStart = (prompt: string) => {
    if (prompt.trim()) {
      setInitialPrompt(prompt);
      setHasStarted(true);
    }
  };

  if (!hasStarted) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-32">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Headline */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight px-2">
              O que vamos criar hoje?
            </h1>
          </div>

          {/* Main Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const prompt = formData.get('prompt') as string;
              handleStart(prompt);
            }} 
            className="max-w-3xl mx-auto mt-8 sm:mt-12"
          >
            <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg hover:border-gray-300 transition-all focus-within:border-blue-500 focus-within:shadow-xl">
              <input
                type="text"
                name="prompt"
                placeholder="Crie ideias de conteúdo para Instagram"
                className="flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg outline-none bg-transparent text-gray-900 placeholder-gray-400"
                autoFocus
              />
              <button
                type="submit"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shadow-md hover:shadow-lg flex-shrink-0"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </form>

          {/* Suggested Prompts */}
          <div className="mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Sem ideias? Tente uma destas opções:</p>
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
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 transition-colors"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
      <div className="w-full">
        <ChatInterface initialPrompt={initialPrompt} />
      </div>
    </div>
  );
}

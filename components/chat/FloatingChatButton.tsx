'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function FloatingChatButton() {
  const pathname = usePathname();
  const [showPulse, setShowPulse] = useState(true);

  // Animação de pulso para chamar atenção
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Não mostrar o botão na própria página de chat
  const isChatPage = pathname === '/dashboard/chat';
  
  if (isChatPage) {
    return null;
  }

  return (
    <Link
      href="/dashboard/chat"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 group"
      aria-label="Falar com a IA treinada pela Nat e o Luigi"
    >
      {/* Ring de pulso para chamar atenção */}
      {showPulse && (
        <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-75"></div>
      )}
      
      {/* Botão principal */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95">
        {/* Badge com foto da Nat e Luigi (simulado com iniciais) */}
        <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-md">
          N&L
        </div>
        
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        
        {/* Indicador de online */}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse shadow-md"></span>
      </div>
      
      {/* Tooltip melhorado no hover (desktop) */}
      <span className="hidden sm:group-hover:block absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl whitespace-nowrap pointer-events-none shadow-xl">
        <div className="font-bold mb-0.5">IA treinada pela Nat & Luigi</div>
        <div className="text-xs text-gray-300">Clique para conversar</div>
        <span className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900"></span>
      </span>
      
      {/* Label mobile */}
      <span className="sm:hidden absolute bottom-full mb-2 right-0 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-active:opacity-100 transition-opacity">
        IA da Nat & Luigi
      </span>
    </Link>
  );
}

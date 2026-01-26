'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { CreatePostProvider } from '@/contexts/CreatePostContext';
import { PostsProvider } from '@/contexts/PostsContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComunidadePage = pathname === '/dashboard/comunidade';

  return (
    <PostsProvider>
      <CreatePostProvider>
        <div className="flex min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative elements - apenas em páginas que não sejam comunidade */}
      {!isComunidadePage && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      )}

      <Sidebar />
      <MobileMenu />
      <main className={`flex-1 md:ml-64 relative z-10 ${isComunidadePage ? 'pt-0' : 'pt-16 md:pt-0'}`}>
        <div className={isComunidadePage ? '' : 'p-0 md:p-8'}>
          {children}
        </div>
      </main>
      
          {/* Botão flutuante de chat - aparece em todas as páginas */}
          <FloatingChatButton />
        </div>
      </CreatePostProvider>
    </PostsProvider>
  );
}

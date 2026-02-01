'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CreatePostProvider } from '@/contexts/CreatePostContext';
import { PostsProvider } from '@/contexts/PostsContext';
import { ChatHistoryProvider } from '@/contexts/ChatHistoryContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComunidadePage = pathname === '/dashboard/comunidade';
  const isCriarPostPage = pathname === '/dashboard/comunidade/criar';
  const hideBlobs = isComunidadePage || isCriarPostPage;

  return (
    <ProtectedRoute>
      <PostsProvider>
        <CreatePostProvider>
          <ChatHistoryProvider>
            <div className="flex min-h-screen bg-white dark:bg-black relative overflow-hidden">
              {/* Background decorative elements - apenas em páginas que não sejam comunidade */}
              {!hideBlobs && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob"></div>
                  <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000"></div>
                  <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000"></div>
                </div>
              )}

              <Sidebar />
              <MobileMenu />
              <main className={`flex-1 md:ml-64 relative z-10 ${isComunidadePage ? 'pt-0' : 'pt-16 md:pt-0'}`}>
                <div className={isComunidadePage ? '' : 'p-0 md:p-8'}>
                  {children}
                </div>
              </main>

              {/* Botão flutuante de chat - apenas em páginas que não sejam comunidade */}
              {/* (na comunidade o botão é renderizado dentro da página com controle do modal) */}
              {!isComunidadePage && <FloatingChatButton />}
            </div>
          </ChatHistoryProvider>
        </CreatePostProvider>
      </PostsProvider>
    </ProtectedRoute>
  );
}

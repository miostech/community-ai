'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountProvider, useAccount } from '@/contexts/AccountContext';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CreatePostProvider } from '@/contexts/CreatePostContext';
import { PostsProvider } from '@/contexts/PostsContext';
import { ChatHistoryProvider } from '@/contexts/ChatHistoryContext';
import { StoriesProvider } from '@/contexts/StoriesContext';
import { Button } from '@/components/ui/Button';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPhone, isLoading } = useAccount();
  const showPhoneModal = !isLoading && !hasPhone && pathname !== '/dashboard/perfil';

  const isComunidadePage = pathname === '/dashboard/comunidade' || pathname?.startsWith('/dashboard/comunidade/');
  const isCriarPostPage = pathname === '/dashboard/comunidade/criar';
  const hideBlobs = isComunidadePage || isCriarPostPage;

  return (
    <>
      <StoriesProvider>
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
                <main className={`flex-1 md:ml-64 relative z-10 overflow-x-hidden ${isComunidadePage ? 'pt-0' : 'pt-16 md:pt-0'}`}>
                  <div className={isComunidadePage ? 'overflow-x-hidden' : 'p-0 md:p-8'}>
                    {children}
                  </div>
                </main>

                {/* Modal de cadastro de telefone - overlay com blur quando usuário não tem telefone */}
                {showPhoneModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md" />
                    <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl p-6 sm:p-8 text-center">
                      <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 mb-4 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                        Cadastre seu telefone
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mb-6">
                        Para usar a comunidade, é preciso cadastrar seu número de telefone no seu perfil.
                      </p>
                      <Link href="/dashboard/perfil">
                        <Button className="w-full sm:w-auto">
                          Ir para Meu Perfil
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Botão flutuante de chat - apenas em páginas que não sejam comunidade */}
                {/* (na comunidade o botão é renderizado dentro da página com controle do modal) */}
                {!isComunidadePage && <FloatingChatButton />}
              </div>
            </ChatHistoryProvider>
          </CreatePostProvider>
        </PostsProvider>
      </StoriesProvider>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AccountProvider>
        <DashboardContent>{children}</DashboardContent>
      </AccountProvider>
    </ProtectedRoute>
  );
}

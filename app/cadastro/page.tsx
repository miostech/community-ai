'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Header } from '@/components/layout/Header';
import { SocialLoginBox } from '@/components/auth/SocialLoginBox';
import { DomeLogo } from '@/components/ui/DomeLogo';

const steps = [
  { number: 1, title: 'Cadastre-se', description: 'Crie sua conta em segundos com Google ou Apple.' },
  { number: 2, title: 'Escolha um plano', description: 'Acesse a cúpula com IA, comunidade e recursos para criadores.' },
  { number: 3, title: 'Comece a criar conteúdo viral', description: 'Use a IA, participe de campanhas de marcas e faça parte da comunidade.' },
];

export default function CadastroPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard/comunidade');
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        redirectTo: '/dashboard/comunidade',
      });
    } catch (err) {
      console.error('Falha ao iniciar login Google', err);
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('apple', {
        redirectTo: '/dashboard/comunidade',
      });
    } catch (err) {
      console.error('Falha ao iniciar login Apple', err);
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white dark:bg-black relative overflow-hidden flex flex-col">
      <Header />
      <div
        className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-6 sm:py-12 pt-16 sm:pt-24 pb-6 sm:pb-12 overflow-y-auto [padding-top:calc(4rem+env(safe-area-inset-top))] sm:[padding-top:calc(6rem+env(safe-area-inset-top))] [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ minHeight: 0 }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-0 w-40 sm:w-72 h-40 sm:h-72 bg-blue-100 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob" />
          <div className="absolute top-32 right-0 w-40 sm:w-72 h-40 sm:h-72 bg-purple-100 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-40 sm:w-72 h-40 sm:h-72 bg-pink-100 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000" />
        </div>

        <div className="w-full max-w-md relative z-10 pt-2 sm:pt-0 sm:my-auto sm:py-4">
          <div className="text-center mb-5 sm:mb-8">
            <Link href="/" className="inline-flex items-center mb-3 sm:mb-4 py-1 -my-1">
              <DomeLogo className="text-4xl sm:text-5xl md:text-6xl" />
            </Link>
            <h1 className="text-[1.35rem] sm:text-2xl font-bold text-gray-900 dark:text-slate-100 leading-tight px-1">
              Crie sua conta
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-1.5 sm:mt-2 px-1">
              Junte-se à cúpula de criadores de conteúdo
            </p>
          </div>

          {/* Passo a passo */}
          <ul className="mb-5 sm:mb-8 space-y-3.5 sm:space-y-4">
            {steps.map((step) => (
              <li
                key={step.number}
                className="flex gap-3 sm:gap-4 items-start text-left"
              >
                <span className="flex-shrink-0 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center text-sm">
                  {step.number}
                </span>
                <div className="min-w-0 pt-0.5">
                  <span className="font-medium text-gray-900 dark:text-slate-100 block text-[0.9375rem] sm:text-base">
                    {step.title}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-slate-400 leading-snug">
                    {step.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <SocialLoginBox
            onGoogleLogin={handleGoogleLogin}
            onAppleLogin={handleAppleLogin}
            onKiwifyLogin={() => {}}
            isLoading={isLoading}
          />

          <p className="text-center text-sm text-gray-500 dark:text-slate-500 mt-4 sm:mt-5">
            <Link
              href="/login"
              className="inline-block py-2 px-3 -mx-3 -my-1 rounded-lg text-blue-600 dark:text-blue-400 hover:underline hover:bg-gray-100 dark:hover:bg-slate-800/80 font-medium active:opacity-80 min-h-[44px] flex items-center justify-center"
            >
              Já tem conta? Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

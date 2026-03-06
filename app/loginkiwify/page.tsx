'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { DomeLogo } from '@/components/ui/DomeLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const COOKIE_NAME = 'dome_kiwify_purchase';
const COOKIE_MAX_AGE = 600; // 10 min

const PLAN_LABELS: Record<string, string> = {
  'dome-mensal': 'Dome Mensal',
  'dome-semestral': 'Dome Semestral',
  'dome-anual': 'Dome Anual',
};

function setKiwifyPurchaseCookie(email: string, planSlug?: string) {
  const payload = encodeURIComponent(JSON.stringify({ email, planSlug }));
  document.cookie = `${COOKIE_NAME}=${payload}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function LoginKiwifyPage() {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validatedData, setValidatedData] = useState<{
    email: string;
    planSlug?: string;
    customerName?: string;
    subscriptionExpiresAt?: string;
    alreadyLinked?: boolean;
  } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard/comunidade');
    }
  }, [status, router]);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Digite o email usado na compra.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/kiwify/validate-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Erro ao validar. Tente novamente.');
        setIsLoading(false);
        return;
      }
      if (!data.ok) {
        setError(data?.error ?? 'Nenhuma compra encontrada para este email.');
        setIsLoading(false);
        return;
      }
      setValidatedData({
        email: trimmed,
        planSlug: data.planSlug,
        customerName: data.customerName,
        subscriptionExpiresAt: data.subscriptionExpiresAt,
        alreadyLinked: data.alreadyLinked === true,
      });
      setStep(2);
    } catch (err) {
      console.error('Erro ao validar email', err);
      setError('Erro ao validar. Tente novamente.');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!validatedData?.email) return;
    setIsLoading(true);
    try {
      setKiwifyPurchaseCookie(validatedData.email, validatedData.planSlug);
      await signIn('google', {
        callbackUrl: '/api/auth/link-kiwify-purchase',
      });
    } catch (err) {
      console.error('Falha ao iniciar login Google', err);
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!validatedData?.email) return;
    setIsLoading(true);
    try {
      setKiwifyPurchaseCookie(validatedData.email, validatedData.planSlug);
      document.cookie = `post_login_redirect=${encodeURIComponent('/api/auth/link-kiwify-purchase')}; path=/; max-age=600; SameSite=Lax`;
      await signIn('apple', {
        callbackUrl: '/api/auth/link-kiwify-purchase',
      });
    } catch (err) {
      console.error('Falha ao iniciar login Apple', err);
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-black relative overflow-hidden flex flex-col items-center justify-center px-5 sm:px-8 py-10 sm:py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 -left-10 w-64 sm:w-96 h-64 sm:h-96 bg-blue-100 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-2xl opacity-20 dark:opacity-30 animate-blob" />
        <div className="absolute top-1/3 -right-10 w-64 sm:w-96 h-64 sm:h-96 bg-purple-100 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-2xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-16 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-pink-100 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-2xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-6 sm:mb-12">
          <Link href="/" className="inline-flex items-center mb-3 sm:mb-6">
            <DomeLogo className="text-4xl sm:text-6xl" />
          </Link>
          <h1 className="text-[1.75rem] leading-tight sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100">
            Seja bem-vindo a Dome
          </h1>
          <p className="text-[0.7rem] sm:text-base uppercase tracking-[0.2em] sm:tracking-widest text-purple-600 dark:text-purple-400 font-semibold mt-2.5 sm:mt-4">
            A primeira cúpula de criadores de conteúdo
          </p>
        </div>

        <div className="text-center mb-7 sm:mb-12">
          <p className="text-[0.9rem] sm:text-lg font-semibold text-gray-800 dark:text-slate-200 mt-3 sm:mt-4">
          Valide o email da compra e acesse a Dome
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-slate-700 p-6 sm:p-10 shadow-xl">
          {step === 1 ? (
            <form onSubmit={handleValidate} className="space-y-4">
              <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
                Digite o email que você usou na compra na Kiwify. Em seguida, crie sua conta com Google ou Apple para acessar a plataforma.
              </p>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                error={error}
                autoComplete="email"
                className="rounded-xl"
              />
              <Button
                type="submit"
                variant="secondary"
                className="w-full rounded-xl py-3.5"
                disabled={isLoading}
              >
                {isLoading ? 'Validando…' : 'Validar e continuar'}
              </Button>
            </form>
          ) : validatedData?.alreadyLinked ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Já existe uma conta vinculada a este email de compra.
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Faça login para acessar a plataforma.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-5 py-3.5 sm:py-4 text-[0.9rem] sm:text-base font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
              >
                Ir para login
              </Link>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setValidatedData(null); }}
                className="w-full text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              >
                Usar outro email
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Compra validada para {validatedData?.email}
                </p>
                {validatedData?.planSlug && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Plano: {PLAN_LABELS[validatedData.planSlug] ?? validatedData.planSlug}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Escolha como deseja criar sua conta. Seu acesso será vinculado ao email de compra.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2.5 sm:gap-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-5 py-3.5 sm:py-4 text-[0.9rem] sm:text-base font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continuar com Google</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2.5 sm:gap-3 rounded-xl bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 px-4 sm:px-5 py-3.5 sm:py-4 text-[0.9rem] sm:text-base font-medium active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <span>Continuar com Apple</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setValidatedData(null); }}
                className="w-full text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              >
                Usar outro email
              </button>
            </div>
          )}

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-slate-500 pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
            Ao continuar, você concorda com nossos{' '}
            <Link href="/termos" className="underline hover:text-gray-700 dark:hover:text-slate-300">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="underline hover:text-gray-700 dark:hover:text-slate-300">
              Política de Privacidade
            </Link>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-slate-500 mt-5">
          <Link
            href="/login"
            className="inline-block py-2 px-3 -mx-3 -my-1 rounded-lg text-blue-600 dark:text-blue-400 hover:underline hover:bg-gray-100 dark:hover:bg-slate-800/80 font-medium"
          >
            Já tem conta? Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

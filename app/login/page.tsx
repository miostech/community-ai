'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [kiwifyModalOpen, setKiwifyModalOpen] = useState(false);
  const [kiwifyStep, setKiwifyStep] = useState<1 | 2>(1);
  const [kiwifyEmail, setKiwifyEmail] = useState('');
  const [kiwifyPassword, setKiwifyPassword] = useState('');
  const [kiwifyHasPassword, setKiwifyHasPassword] = useState(false);
  const [kiwifyError, setKiwifyError] = useState('');

  // Redireciona para o dashboard se já estiver logado
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard/comunidade');
    }
  }, [status, router]);

  const openKiwifyModal = () => {
    setKiwifyModalOpen(true);
    setKiwifyStep(1);
    setKiwifyEmail('');
    setKiwifyPassword('');
    setKiwifyHasPassword(false);
    setKiwifyError('');
  };

  const closeKiwifyModal = () => {
    setKiwifyModalOpen(false);
    setKiwifyStep(1);
    setKiwifyEmail('');
    setKiwifyPassword('');
    setKiwifyHasPassword(false);
    setKiwifyError('');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/dashboard/comunidade',
        redirect: true,
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
        callbackUrl: '/dashboard/comunidade',
        redirect: true,
      });
    } catch (err) {
      console.error('Falha ao iniciar login Apple', err);
      setIsLoading(false);
    }
  };

  const handleKiwifyStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setKiwifyError('');
    const email = kiwifyEmail.trim().toLowerCase();
    if (!email) {
      setKiwifyError('Digite o email usado na compra.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/kiwify/check-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKiwifyError(data?.error ?? 'Erro ao validar email.');
        setIsLoading(false);
        return;
      }
      const courseIds = data.courseIds ?? [];
      if (courseIds.length === 0) {
        setKiwifyError('Nenhuma compra encontrada para este email. Use o mesmo email da sua compra na Kiwify.');
        setIsLoading(false);
        return;
      }
      try {
        const checkRes = await fetch(`/api/accounts/kiwify-check?email=${encodeURIComponent(email)}`);
        const checkData = await checkRes.json();
        setKiwifyHasPassword(!!checkData.hasPassword);
      } catch {
        setKiwifyHasPassword(false);
      }
      setKiwifyStep(2);
      setKiwifyError('');
    } catch (err) {
      console.error('Erro ao validar email Kiwify', err);
      setKiwifyError('Erro ao validar. Tente novamente.');
    }
    setIsLoading(false);
  };

  const handleKiwifyStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setKiwifyError('');
    const email = kiwifyEmail.trim().toLowerCase();
    const password = kiwifyPassword;
    if (!password) {
      setKiwifyError('Digite uma senha.');
      return;
    }
    if (password.length < 6) {
      setKiwifyError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      const validateRes = await fetch('/api/accounts/kiwify-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      let validateData: { ok?: boolean; error?: string } = {};
      try {
        validateData = await validateRes.json();
      } catch {
        setKiwifyError('Resposta inválida do servidor. Tente novamente.');
        setIsLoading(false);
        return;
      }

      if (!validateRes.ok || !validateData.ok) {
        const msg = validateData.error ?? 'Erro ao validar. Tente novamente.';
        setKiwifyError(msg);
        setIsLoading(false);
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Kiwify] Validação falhou:', msg, '(status:', validateRes.status, ')');
        }
        return;
      }

      const result = await signIn('kiwify', {
        email,
        password,
        callbackUrl: '/dashboard/comunidade',
        redirect: false,
      });
      if (result?.error) {
        setKiwifyError('Erro ao concluir o login. Tente novamente.');
        setIsLoading(false);
        return;
      }
      if (result?.ok) {
        closeKiwifyModal();
        router.push('/dashboard/comunidade');
        return;
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Falha no login Kiwify', err);
      setKiwifyError('Erro ao entrar. Tente novamente.');
      setIsLoading(false);
    }
  };

  // Mostra loading enquanto verifica a sessão
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      <Header />
      <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 py-8 sm:py-12 pt-20 sm:pt-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-100 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-purple-100 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-48 sm:w-72 h-48 sm:h-72 bg-pink-100 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">IA</span>
            </div>
            <span className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-slate-100">Conteúdo IA</span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-normal">2.0</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">Entre na sua conta</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-1 sm:mt-2">Continue criando conteúdo incrível</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-slate-700 p-6 sm:p-8 space-y-4 shadow-lg">
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center space-x-2"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continuar com Google</span>
          </Button>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-center space-x-2 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            onClick={handleAppleLogin}
            disabled={isLoading}
            type="button"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>Continuar com Apple</span>
          </Button>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-center space-x-2 border border-emerald-500/50 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400/50 dark:bg-emerald-500/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/20"
            onClick={openKiwifyModal}
            disabled={isLoading}
            type="button"
          >
            <span>Continuar com Kiwify</span>
          </Button>

          <p className="text-center text-xs text-gray-500 dark:text-slate-500 mt-4">
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
      </div>
      </div>

      {/* Modal Kiwify */}
      {kiwifyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70"
          onClick={(e) => e.target === e.currentTarget && closeKiwifyModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="kiwify-modal-title"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="kiwify-modal-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {kiwifyStep === 1 ? 'Email de compra' : kiwifyHasPassword ? 'Digite sua senha' : 'Cadastre uma senha'}
              </h2>
              <button
                type="button"
                onClick={closeKiwifyModal}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {kiwifyStep === 1 ? (
              <form onSubmit={handleKiwifyStep1} className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Insira o email que você usou na compra na Kiwify.
                </p>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={kiwifyEmail}
                  onChange={(e) => { setKiwifyEmail(e.target.value); setKiwifyError(''); }}
                  disabled={isLoading}
                  error={kiwifyError}
                  autoComplete="email"
                  className="rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={closeKiwifyModal}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="secondary" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Validando…' : 'Continuar'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleKiwifyStep2} className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {kiwifyHasPassword
                    ? 'Use a senha que você cadastrou quando entrou pela primeira vez.'
                    : 'Cadastre uma senha com pelo menos 6 caracteres. Use essa senha nas próximas vezes para entrar.'}
                </p>
                {kiwifyError ? (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">
                    {kiwifyError}
                  </div>
                ) : null}
                <Input
                  type="password"
                  placeholder={kiwifyHasPassword ? 'Sua senha' : 'Senha (mín. 6 caracteres)'}
                  value={kiwifyPassword}
                  onChange={(e) => { setKiwifyPassword(e.target.value); setKiwifyError(''); }}
                  disabled={isLoading}
                  error={kiwifyError}
                  autoComplete="new-password"
                  className="rounded-lg"
                  minLength={6}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setKiwifyStep(1); setKiwifyError(''); }}
                    disabled={isLoading}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" variant="secondary" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Entrando…' : 'Entrar'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

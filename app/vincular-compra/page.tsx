'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { DomeLogo } from '@/components/ui/DomeLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const COOKIE_NAME = 'dome_kiwify_purchase';
const COOKIE_MAX_AGE = 600;

const PLAN_LABELS: Record<string, string> = {
    'dome-mensal': 'Dome Mensal',
    'dome-semestral': 'Dome Semestral',
    'dome-anual': 'Dome Anual',
};

function setKiwifyPurchaseCookie(email: string, planSlug?: string) {
    const payload = encodeURIComponent(JSON.stringify({ email, planSlug }));
    document.cookie = `${COOKIE_NAME}=${payload}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function VincularCompraPublicPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'email' | 'login' | 'linking' | 'success'>('email');
    const [validatedData, setValidatedData] = useState<{
        email: string;
        planSlug?: string;
        customerName?: string;
        alreadyLinked?: boolean;
    } | null>(null);
    const [linkResult, setLinkResult] = useState<{ product_name?: string } | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && validatedData && step === 'login') {
            linkPurchase(validatedData.email);
        }
    }, [status, validatedData, step]);

    const handleValidateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError('Digite o email usado na compra.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/kiwify/validate-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });
            const data = await res.json();

            if (!data.ok) {
                setError(data.error || 'Nenhuma compra encontrada para este email.');
                setLoading(false);
                return;
            }

            setValidatedData({
                email: trimmed,
                planSlug: data.planSlug,
                customerName: data.customerName,
                alreadyLinked: data.alreadyLinked === true,
            });

            if (data.alreadyLinked) {
                setStep('login');
                setLoading(false);
                return;
            }

            if (status === 'authenticated') {
                await linkPurchase(trimmed);
            } else {
                setStep('login');
            }
        } catch {
            setError('Erro ao validar. Tente novamente.');
        }
        setLoading(false);
    };

    const linkPurchase = async (purchaseEmail: string) => {
        setStep('linking');
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/accounts/link-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: purchaseEmail }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao vincular compra.');
                setStep('email');
                setLoading(false);
                return;
            }

            setLinkResult({ product_name: data.product_name });
            setStep('success');
        } catch {
            setError('Erro de conexão. Tente novamente.');
            setStep('email');
        }
        setLoading(false);
    };

    const handleGoogleLogin = () => {
        if (!validatedData) return;
        setLoading(true);
        setKiwifyPurchaseCookie(validatedData.email, validatedData.planSlug);
        signIn('google', { callbackUrl: '/api/auth/link-kiwify-purchase' });
    };

    const handleAppleLogin = () => {
        if (!validatedData) return;
        setLoading(true);
        setKiwifyPurchaseCookie(validatedData.email, validatedData.planSlug);
        document.cookie = `post_login_redirect=${encodeURIComponent('/api/auth/link-kiwify-purchase')}; path=/; max-age=600; SameSite=Lax`;
        signIn('apple', { callbackUrl: '/api/auth/link-kiwify-purchase' });
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
                <div className="text-center mb-6 sm:mb-10">
                    <Link href="/" className="inline-flex items-center mb-3 sm:mb-6">
                        <DomeLogo className="text-4xl sm:text-6xl" />
                    </Link>
                    <h1 className="text-[1.5rem] leading-tight sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                        Vincular compra da Kiwify
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-2">
                        Pagou com um email diferente do seu cadastro? Vincule aqui.
                    </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-slate-700 p-6 sm:p-10 shadow-xl">
                    {step === 'email' && (
                        <form onSubmit={handleValidateEmail} className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Digite o email que usou na compra na Kiwify para vincular ao seu cadastro na Dome.
                            </p>

                            {error && (
                                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            <Input
                                type="email"
                                placeholder="email@usado-na-kiwify.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                disabled={loading}
                                autoComplete="email"
                                className="rounded-xl"
                            />

                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full rounded-xl py-3.5"
                                disabled={loading}
                            >
                                {loading ? 'Verificando...' : 'Verificar compra'}
                            </Button>
                        </form>
                    )}

                    {step === 'login' && validatedData && !validatedData.alreadyLinked && (
                        <div className="space-y-5">
                            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Compra encontrada para {validatedData.email}
                                </p>
                                {validatedData.planSlug && (
                                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                        Plano: {PLAN_LABELS[validatedData.planSlug] ?? validatedData.planSlug}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Entre ou crie sua conta com Google ou Apple para ativar seu plano.
                            </p>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3.5 text-[0.9rem] font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 active:scale-[0.98] transition-all disabled:opacity-50"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Entrar com Google
                                </button>
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 px-4 py-3.5 text-[0.9rem] font-medium active:scale-[0.98] transition-all disabled:opacity-50"
                                    onClick={handleAppleLogin}
                                    disabled={loading}
                                >
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                    </svg>
                                    Entrar com Apple
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setStep('email'); setError(''); setValidatedData(null); }}
                                className="w-full text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                            >
                                Usar outro email
                            </button>
                        </div>
                    )}

                    {step === 'login' && validatedData?.alreadyLinked && (
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
                                className="block w-full text-center rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3.5 text-[0.9rem] font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
                            >
                                Ir para login
                            </Link>
                            <button
                                type="button"
                                onClick={() => { setStep('email'); setError(''); setValidatedData(null); }}
                                className="w-full text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                            >
                                Usar outro email
                            </button>
                        </div>
                    )}

                    {step === 'linking' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-gray-600 dark:text-slate-400">Vinculando compra...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="space-y-5 text-center">
                            <div className="text-5xl">&#10003;</div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                                Compra vinculada!
                            </h2>
                            {linkResult?.product_name && (
                                <p className="text-sm text-gray-600 dark:text-slate-400">
                                    Produto: {linkResult.product_name}
                                </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Seu plano já está ativo. Pode levar alguns segundos para atualizar.
                            </p>
                            <Link
                                href="/dashboard"
                                className="inline-block rounded-xl bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition-colors"
                            >
                                Ir para o Dashboard
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-2 mt-5">
                    <a
                        href={`https://wa.me/551153042686?text=${encodeURIComponent('Olá, preciso de ajuda para vincular minha compra na Dome.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 py-2 px-3 rounded-lg text-green-600 dark:text-green-400 hover:underline hover:bg-green-50 dark:hover:bg-green-900/20 font-medium text-sm transition-colors"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Precisa de ajuda? Fale com o suporte
                    </a>
                    <Link
                        href={status === 'authenticated' ? '/dashboard' : '/login'}
                        className="inline-block py-2 px-3 rounded-lg text-blue-600 dark:text-blue-400 hover:underline hover:bg-gray-100 dark:hover:bg-slate-800/80 font-medium text-sm"
                    >
                        {status === 'authenticated' ? 'Voltar ao Dashboard' : 'Já tem conta? Entrar'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

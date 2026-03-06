'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { DomeLogo } from '@/components/ui/DomeLogo';

const CAMPAIGN_COOKIE = 'dome_campaign';
const CAMPAIGN_VALUE = '10days-free';

function setCampaignCookie() {
    document.cookie = `${CAMPAIGN_COOKIE}=${CAMPAIGN_VALUE}; path=/; max-age=3600; SameSite=Lax`;
}

export default function CampanhaPage() {
    const { status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/api/campaign/activate');
        }
    }, [status, router]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            setCampaignCookie();
            await signIn('google', {
                redirectTo: '/api/campaign/activate',
            });
        } catch (err) {
            console.error('Falha ao iniciar login Google', err);
            setIsLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        try {
            setCampaignCookie();
            document.cookie = `post_login_redirect=${encodeURIComponent('/api/campaign/activate')}; path=/; max-age=600; SameSite=Lax`;
            await signIn('apple', {
                redirectTo: '/api/campaign/activate',
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
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 -left-10 w-64 sm:w-96 h-64 sm:h-96 bg-blue-100 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-2xl opacity-20 dark:opacity-30 animate-blob" />
                <div className="absolute top-1/3 -right-10 w-64 sm:w-96 h-64 sm:h-96 bg-purple-100 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-2xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-16 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-pink-100 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-2xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000" />
            </div>

            <div className="w-full max-w-xl relative z-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-12">
                    <div className="inline-flex items-center mb-3 sm:mb-6">
                        <DomeLogo className="text-4xl sm:text-6xl" />
                    </div>
                    <h1 className="text-[1.75rem] leading-tight sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100">
                        Seja bem-vindo a Dome
                    </h1>
                    <p className="text-[0.7rem] sm:text-base uppercase tracking-[0.2em] sm:tracking-widest text-purple-600 dark:text-purple-400 font-semibold mt-2.5 sm:mt-4">
                        A primeira cúpula de criadores de conteúdo
                    </p>
                </div>

                {/* Descrição */}
                <div className="text-center mb-7 sm:mb-12">
                    <p className="text-[0.9rem] leading-relaxed sm:text-lg text-gray-600 dark:text-slate-400">
                        A Dome nasceu para criadores que querem levar o conteúdo para outro nível. Uma comunidade exclusiva onde você se conecta com pessoas que também estão construindo presença, autoridade e resultados nas redes. Dentro da Dome, você também tem acesso a uma IA exclusiva, treinada pela Nat e pelo Luigi, que ajuda a desenvolver ideias, melhorar seu posicionamento e evoluir de forma estratégica.
                    </p>
                    <p className="text-[0.9rem] sm:text-lg font-semibold text-gray-800 dark:text-slate-200 mt-3 sm:mt-4">
                        Construa autoridade de forma intencional.
                    </p>
                </div>

                {/* Login buttons */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-slate-700 p-6 sm:p-10 space-y-4 sm:space-y-5 shadow-xl">
                    {/* Badge promo */}
                    <div className="flex justify-center -mt-10 sm:-mt-14 mb-2 sm:mb-3">
                        <span className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Você tem 14 dias grátis para testar a Dome.
                        </span>
                    </div>

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
                        <span>Cadastrar com Google</span>
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
                        <span>Cadastrar com Apple</span>
                    </button>

                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-slate-500 pt-3 sm:pt-4 border-t border-gray-100 dark:border-slate-700">
                        Ao se cadastrar, você concorda com nossos{' '}
                        <a href="/termos" className="underline hover:text-gray-700 dark:hover:text-slate-300">
                            Termos de Uso
                        </a>{' '}
                        e{' '}
                        <a href="/privacidade" className="underline hover:text-gray-700 dark:hover:text-slate-300">
                            Política de Privacidade
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { SocialLoginBox } from '@/components/auth/SocialLoginBox';

export interface Plan {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    kiwifyUrl: string;
    popular?: boolean;
}

export const defaultPlans: Plan[] = [
    {
        id: 'conteudo-ia',
        name: 'Dome',
        price: '34,99',
        period: 'mês',
        description: 'Acesso completo à plataforma Dome de criação de conteúdo com IA',
        features: [
            'Criação ilimitada de conteúdo',
            'Templates exclusivos',
            'Chat com IA para melhorias',
            'Acesso à comunidade',
            'Salvar projetos ilimitados',
            'Suporte prioritário',
        ],
        kiwifyUrl: 'https://pay.kiwify.com.br/1k68u0Y',
        popular: false,
    },
    {
        id: 'combo-viral',
        name: 'Combo Viral',
        price: '599,99',
        period: 'ano',
        description: 'Todos os 3 cursos + Dome por 1 ano completo',
        features: [
            'Acesso a todos os 3 cursos',
            'Dome por 1 ano',
            'Roteiro Viral!',
            'H.P.A. - Hackeando Passagens Aéreas',
            'Método Influência MILIONÁRIA',
            'Criação ilimitada de conteúdo',
            'Templates exclusivos',
            'Acesso à comunidade',
            'Suporte VIP',
        ],
        kiwifyUrl: 'https://pay.kiwify.com.br/1k68u0Y',
        popular: true,
    },
];

interface PricingPlansProps {
    plans?: Plan[];
    title?: string;
    subtitle?: string;
    showFAQ?: boolean;
}

export function PricingPlans({
    plans = defaultPlans,
    title = 'Escolha seu plano',
    subtitle = 'Planos flexíveis para criar conteúdo e dominar estratégias de crescimento',
    showFAQ = true,
}: PricingPlansProps) {
    const { data: session, status } = useSession();
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    // Busca o email do usuário logado quando a sessão estiver pronta
    useEffect(() => {
        const fetchUserEmail = async () => {
            if (status === 'authenticated' && session?.user) {
                try {
                    const response = await fetch('/api/accounts');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.account?.email) {
                            setUserEmail(data.account.email);
                        }
                    }
                } catch (err) {
                    console.error('Erro ao buscar email do usuário:', err);
                }
            }
        };
        fetchUserEmail();
    }, [status, session]);

    // Bloqueia scroll do body quando o modal está aberto
    useEffect(() => {
        if (loginModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [loginModalOpen]);

    const handleBuyClick = (plan: Plan) => {
        // Se já está logado e tem email, vai direto para a Kiwify
        if (status === 'authenticated' && userEmail) {
            const kiwifyUrlWithEmail = `${plan.kiwifyUrl}?email=${encodeURIComponent(userEmail)}`;
            window.location.href = kiwifyUrlWithEmail;
            return;
        }

        // Se não está logado, abre o modal de login
        setSelectedPlan(plan);
        setLoginModalOpen(true);
    };

    const closeLoginModal = () => {
        setLoginModalOpen(false);
        setSelectedPlan(null);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const redirectPath = `/api/checkout-redirect?plan=${selectedPlan?.id}`;
            // Salva o redirect em cookie como backup (Apple OAuth às vezes perde o state)
            document.cookie = `post_login_redirect=${encodeURIComponent(redirectPath)}; path=/; max-age=600; SameSite=Lax`;
            await signIn('google', {
                redirectTo: redirectPath,
            });
        } catch (err) {
            console.error('Falha ao iniciar login Google', err);
            setIsLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        try {
            const redirectPath = `/api/checkout-redirect?plan=${selectedPlan?.id}`;
            // Salva o redirect em cookie como backup (Apple OAuth às vezes perde o state)
            document.cookie = `post_login_redirect=${encodeURIComponent(redirectPath)}; path=/; max-age=600; SameSite=Lax`;
            await signIn('apple', {
                redirectTo: redirectPath,
            });
        } catch (err) {
            console.error('Falha ao iniciar login Apple', err);
            setIsLoading(false);
        }
    };

    const handleKiwifyLogin = () => {
        if (selectedPlan) {
            window.location.href = `/login?redirect=${encodeURIComponent(selectedPlan.kiwifyUrl)}`;
        }
    };

    return (
        <>
            <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12 md:mb-16">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-slate-100 leading-tight px-2">
                    {title}
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
                    {subtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 ${plan.popular
                            ? 'border-blue-500 dark:border-blue-400 shadow-xl md:scale-105'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-lg'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                                    Mais Popular
                                </span>
                            </div>
                        )}

                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1 sm:mb-2">{plan.name}</h3>
                                <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">{plan.description}</p>
                            </div>

                            <div className="flex items-baseline space-x-1 sm:space-x-2">
                                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100">R$ {plan.price}</span>
                                <span className="text-sm sm:text-base text-gray-600 dark:text-slate-400">/{plan.period}</span>
                            </div>

                            <ul className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start space-x-3">
                                        <svg
                                            className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span className="text-gray-700 dark:text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${plan.popular
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                                    : ''
                                    }`}
                                onClick={() => handleBuyClick(plan)}
                            >
                                Comprar Agora
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {showFAQ && (
                <div className="mt-12 sm:mt-16 md:mt-20 max-w-3xl mx-auto px-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 text-center mb-8 sm:mb-12">
                        Perguntas Frequentes
                    </h2>
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-600 p-4 sm:p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm sm:text-base mb-1 sm:mb-2">
                                Posso cancelar a qualquer momento?
                            </h3>
                            <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">
                                Sim, você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento.
                            </p>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-600 p-4 sm:p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm sm:text-base mb-1 sm:mb-2">
                                O que está incluído no Combo Viral?
                            </h3>
                            <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">
                                O Combo Viral inclui acesso completo aos 3 cursos (Roteiro Viral, H.P.A. e Método Influência MILIONÁRIA) mais 1 ano completo de Dome.
                            </p>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-600 p-4 sm:p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm sm:text-base mb-1 sm:mb-2">
                                Como funciona o pagamento?
                            </h3>
                            <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">
                                O pagamento é processado de forma segura pela Kiwify. Você pode pagar com cartão de crédito, débito ou PIX.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Login */}
            {loginModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70"
                    onClick={(e) => e.target === e.currentTarget && closeLoginModal()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="login-modal-title"
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 shadow-xl w-full max-w-md p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closeLoginModal}
                            className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            aria-label="Fechar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 id="login-modal-title" className="text-xl font-bold text-gray-900 dark:text-slate-100">
                                Entre ou crie sua conta
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                                Para continuar com a compra do <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedPlan?.name}</span>, faça login ou crie sua conta
                            </p>
                        </div>

                        <SocialLoginBox
                            onGoogleLogin={handleGoogleLogin}
                            onAppleLogin={handleAppleLogin}
                            onKiwifyLogin={handleKiwifyLogin}
                            isLoading={isLoading}
                            showTerms={true}
                        />

                        <p className="text-center text-xs text-gray-500 dark:text-slate-500 mt-4">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

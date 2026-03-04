'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { PricingPlans, Plan } from '@/components/pricing/PricingPlans';

const promoPlans: Plan[] = [
    {
        id: 'promo-mensal',
        name: 'Dome - Mensal',
        price: '29,90',
        originalPrice: '47,90',
        period: 'mês',
        description:
            'Acesso mensal à cúpula do Dome com a IA treinada pela Natália e pelo Luigi, ideias de conteúdo e rede de criadores.',
        features: [
            'Ideias estruturadas de conteúdo (engajamento e conversão)',
            'Chat com IA — assistente de criação treinada pelos criadores',
            'Acesso à comunidade de criadores (troca de estratégias e inspiração)',
            'Temas em alta (assuntos que estão gerando engajamento)',
            'Suporte prioritário',
        ],
        kiwifyUrl: 'https://pay.kiwify.com.br/CneNNFc',
        popular: false,
    },
    {
        id: 'promo-semestral',
        name: 'Dome - Semestral',
        price: '89,90',
        originalPrice: '287,40',
        period: 'semestre',
        description:
            '6 meses de acesso à cúpula do Dome com a IA treinada pela Natália e pelo Luigi, ideias de conteúdo e rede de criadores.',
        features: [
            'Ideias estruturadas de conteúdo (engajamento e conversão)',
            'Chat com IA — assistente de criação treinada pelos criadores',
            'Acesso à comunidade de criadores (troca de estratégias e inspiração)',
            'Temas em alta (assuntos que estão gerando engajamento)',
            'Suporte prioritário',
        ],
        kiwifyUrl: 'https://pay.kiwify.com.br/tuxuXlK',
        popular: true,
        badgeText: 'Mais escolhido',
    },
];

export default function PromoPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob" />
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000" />
            </div>

            <Header />

            <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20 md:pt-40 md:pb-32">
                <PricingPlans
                    plans={promoPlans}
                    title="Oferta especial para você"
                    subtitle="Aproveite preços promocionais por tempo limitado"
                />
            </section>
        </div>
    );
}

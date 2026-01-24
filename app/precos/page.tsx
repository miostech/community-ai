'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';

const plans = [
  {
    id: 'conteudo-ia',
    name: 'Conteúdo IA',
    price: '34,99',
    period: 'mês',
    description: 'Acesso completo à plataforma de criação de conteúdo com IA',
    features: [
      'Criação ilimitada de conteúdo',
      'Templates exclusivos',
      'Chat com IA para melhorias',
      'Acesso à comunidade',
      'Salvar projetos ilimitados',
      'Suporte prioritário',
    ],
    kiwifyUrl: 'https://pay.kiwify.com.br/conteudo-ia', // TODO: Adicionar link real da Kiwify quando disponível
    popular: false,
  },
  {
    id: 'combo-viral',
    name: 'Combo Viral',
    price: '599,99',
    period: 'ano',
    description: 'Todos os 3 cursos + Conteúdo IA por 1 ano completo',
    features: [
      'Acesso a todos os 3 cursos',
      'Conteúdo IA por 1 ano',
      'Roteiro Viral!',
      'H.P.A. - Hackeando Passagens Aéreas',
      'Método Influência MILIONÁRIA',
      'Criação ilimitada de conteúdo',
      'Templates exclusivos',
      'Acesso à comunidade',
      'Suporte VIP',
    ],
    kiwifyUrl: 'https://pay.kiwify.com.br/combo-viral', // TODO: Adicionar link real da Kiwify quando disponível
    popular: true,
  },
];

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20 md:pt-40 md:pb-32">
        <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight px-2">
            Escolha seu plano
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Planos flexíveis para criar conteúdo e dominar estratégias de crescimento
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 ${
                plan.popular
                  ? 'border-blue-500 shadow-xl md:scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
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
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{plan.description}</p>
                </div>

                <div className="flex items-baseline space-x-1 sm:space-x-2">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">R$ {plan.price}</span>
                  <span className="text-sm sm:text-base text-gray-600">/{plan.period}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      : ''
                  }`}
                  onClick={() => window.open(plan.kiwifyUrl, '_blank')}
                >
                  Comprar Agora
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 sm:mt-16 md:mt-20 max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Sim, você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">
                O que está incluído no Combo Viral?
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                O Combo Viral inclui acesso completo aos 3 cursos (Roteiro Viral, H.P.A. e Método Influência MILIONÁRIA) mais 1 ano completo de Conteúdo IA.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">
                Como funciona o pagamento?
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                O pagamento é processado de forma segura pela Kiwify. Você pode pagar com cartão de crédito, débito ou PIX.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

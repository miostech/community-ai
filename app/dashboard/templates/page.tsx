'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const templates = [
  {
    id: 'reels',
    title: 'Roteiro para Reels',
    description: 'Estrutura completa para criar Reels engajadores',
    icon: '🎬',
    questions: 3,
  },
  {
    id: 'viral',
    title: 'Ideia de Post Viral',
    description: 'Conceitos testados para aumentar alcance',
    icon: '🚀',
    questions: 2,
  },
  {
    id: 'storytelling',
    title: 'Storytelling Pessoal',
    description: 'Narrativas que conectam com sua audiência',
    icon: '📖',
    questions: 4,
  },
  {
    id: 'educational',
    title: 'Conteúdo Educativo Rápido',
    description: 'Dicas e tutoriais em formato digestível',
    icon: '💡',
    questions: 2,
  },
  {
    id: 'sales',
    title: 'Venda sem Parecer Venda',
    description: 'Abordagem sutil para conversão',
    icon: '💼',
    questions: 3,
  },
  {
    id: 'carousel',
    title: 'Carrossel Informativo',
    description: 'Estrutura para posts educativos em carrossel',
    icon: '🔄',
    questions: 3,
  },
];

export default function TemplatesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Templates</h1>
        <p className="text-sm sm:text-base text-gray-600">Escolha um template e crie conteúdo em minutos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            onClick={() => {
              // Navegar para o template específico
              window.location.href = `/dashboard/templates/${template.id}`;
            }}
            className="hover:shadow-lg transition-shadow"
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="text-3xl sm:text-4xl">
                {template.id === 'reels' ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                    <Image
                      src="/images/cursos/icon_claquete.png"
                      alt="Claquete"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                ) : template.id === 'viral' ? (
                  <div className="w-12 h-12 relative">
                    <Image
                      src="/images/cursos/icon_foguete.png"
                      alt="Foguete"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                ) : template.id === 'storytelling' ? (
                  <div className="w-12 h-12 relative">
                    <Image
                      src="/images/cursos/icon_livro.png"
                      alt="Livro"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                ) : template.id === 'educational' ? (
                  <div className="w-12 h-12 relative">
                    <Image
                      src="/images/cursos/icon_lampada.png"
                      alt="Lâmpada"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                ) : template.id === 'sales' ? (
                  <div className="w-12 h-12 relative">
                    <Image
                      src="/images/cursos/icon_money.png"
                      alt="Dinheiro"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                ) : template.id === 'carousel' ? (
                  <div className="w-12 h-12 relative">
                    <Image
                      src="/images/cursos/icon_carrossel.png"
                      alt="Carrossel"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  template.icon
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1">
                  {template.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">{template.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200">
                <span className="text-[10px] sm:text-xs text-gray-500">
                  {template.questions} perguntas
                </span>
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  Usar template →
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

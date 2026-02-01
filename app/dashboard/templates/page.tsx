'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Código de Templates comentado - não está em uso no momento
/*
import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const templates = [
  { id: 'reels', title: 'Roteiro para Reels', description: 'Estrutura completa para criar Reels engajadores', icon: '🎬', questions: 3 },
  { id: 'viral', title: 'Ideia de Post Viral', description: 'Conceitos testados para aumentar alcance', icon: '🚀', questions: 2 },
  { id: 'storytelling', title: 'Storytelling Pessoal', description: 'Narrativas que conectam com sua audiência', icon: '📖', questions: 4 },
  { id: 'educational', title: 'Conteúdo Educativo Rápido', description: 'Dicas e tutoriais em formato digestível', icon: '💡', questions: 2 },
  { id: 'sales', title: 'Venda sem Parecer Venda', description: 'Abordagem sutil para conversão', icon: '💼', questions: 3 },
  { id: 'carousel', title: 'Carrossel Informativo', description: 'Estrutura para posts educativos em carrossel', icon: '🔄', questions: 3 },
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
          <Card key={template.id} onClick={() => window.location.href = `/dashboard/templates/${template.id}`} className="hover:shadow-lg transition-shadow">
            ...
          </Card>
        ))}
      </div>
    </div>
  );
}
*/

export default function TemplatesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o dashboard (Templates não está em uso no momento)
    router.replace('/dashboard');
  }, [router]);

  return null;
}

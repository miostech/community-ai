'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const templateConfigs: Record<string, {
  title: string;
  description: string;
  questions: Array<{ id: string; label: string; type: 'text' | 'textarea' | 'select'; options?: string[] }>;
}> = {
  reels: {
    title: 'Roteiro para Reels',
    description: 'Crie um roteiro completo e estruturado para seus Reels',
    questions: [
      { id: 'topic', label: 'Sobre o que é o Reels?', type: 'text' },
      { id: 'objective', label: 'Qual o objetivo principal?', type: 'select', options: ['Educar', 'Entreter', 'Vender', 'Engajar'] },
      { id: 'duration', label: 'Duração aproximada (segundos)', type: 'text' },
    ],
  },
  viral: {
    title: 'Ideia de Post Viral',
    description: 'Gere conceitos com potencial de viralizar',
    questions: [
      { id: 'niche', label: 'Qual seu nicho?', type: 'text' },
      { id: 'platform', label: 'Plataforma', type: 'select', options: ['Instagram', 'TikTok', 'YouTube'] },
    ],
  },
  storytelling: {
    title: 'Storytelling Pessoal',
    description: 'Crie narrativas que conectam com sua audiência',
    questions: [
      { id: 'story', label: 'Qual história você quer contar?', type: 'textarea' },
      { id: 'lesson', label: 'Qual lição ou mensagem principal?', type: 'text' },
      { id: 'emotion', label: 'Qual emoção você quer transmitir?', type: 'select', options: ['Inspiração', 'Empatia', 'Motivação', 'Reflexão'] },
      { id: 'platform', label: 'Plataforma', type: 'select', options: ['Instagram', 'TikTok', 'YouTube', 'Blog'] },
    ],
  },
  educational: {
    title: 'Conteúdo Educativo Rápido',
    description: 'Dicas e tutoriais em formato digestível',
    questions: [
      { id: 'topic', label: 'Tópico a ser ensinado', type: 'text' },
      { id: 'format', label: 'Formato', type: 'select', options: ['Dica rápida', 'Tutorial passo a passo', 'Comparação', 'Lista'] },
    ],
  },
  sales: {
    title: 'Venda sem Parecer Venda',
    description: 'Abordagem sutil para conversão',
    questions: [
      { id: 'product', label: 'Produto ou serviço', type: 'text' },
      { id: 'audience', label: 'Público-alvo', type: 'text' },
      { id: 'benefit', label: 'Principal benefício', type: 'text' },
    ],
  },
  carousel: {
    title: 'Carrossel Informativo',
    description: 'Estrutura para posts educativos em carrossel',
    questions: [
      { id: 'topic', label: 'Tema do carrossel', type: 'text' },
      { id: 'slides', label: 'Quantidade de slides', type: 'select', options: ['3-5', '6-8', '9-10'] },
      { id: 'style', label: 'Estilo', type: 'select', options: ['Lista numerada', 'Passo a passo', 'Comparação', 'Dicas'] },
    ],
  },
};

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const template = templateConfigs[templateId];

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Template não encontrado</p>
            <Button onClick={() => router.push('/dashboard/templates')}>
              Voltar para Templates
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < template.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simular geração
    setTimeout(() => {
      setResult({
        hook: 'Hook gerado baseado nas suas respostas',
        development: 'Conteúdo desenvolvido seguindo a estrutura do template',
        cta: 'Call to action otimizado',
      });
      setIsGenerating(false);
    }, 2000);
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
          <Button variant="ghost" onClick={() => {
            setResult(null);
            setCurrentStep(0);
            setAnswers({});
          }}>
            Criar Novo
          </Button>
        </div>

        <Card className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Hook</h3>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={2}
                defaultValue={result.hook}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Desenvolvimento</h3>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={6}
                defaultValue={result.development}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">CTA</h3>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={2}
                defaultValue={result.cta}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="secondary">Salvar Projeto</Button>
            <Button variant="secondary">Gerar Variação</Button>
            <Button className="ml-auto">Copiar</Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = template.questions[currentStep];
  const progress = ((currentStep + 1) / template.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/templates')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
        >
          ← Voltar para Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.title}</h1>
        <p className="text-gray-600">{template.description}</p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Pergunta {currentStep + 1} de {template.questions.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              {currentQuestion.label}
            </label>
            
            {currentQuestion.type === 'text' && (
              <Input
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                placeholder="Digite sua resposta..."
              />
            )}
            
            {currentQuestion.type === 'textarea' && (
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={4}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                placeholder="Digite sua resposta..."
              />
            )}
            
            {currentQuestion.type === 'select' && (
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
              >
                <option value="">Selecione uma opção</option>
                {currentQuestion.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id] || isGenerating}
            >
              {currentStep === template.questions.length - 1
                ? isGenerating
                  ? 'Gerando...'
                  : 'Gerar Conteúdo'
                : 'Próximo'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChatInterface } from '@/components/chat/ChatInterface';

type Step = 'platform' | 'objective' | 'tone' | 'type' | 'result';
type ViewMode = 'content' | 'chat';

const platforms = [
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'blog', label: 'Blog', icon: '✍️' },
];

const objectives = [
  { id: 'engagement', label: 'Engajamento', description: 'Aumentar likes, comentários e compartilhamentos' },
  { id: 'growth', label: 'Crescimento', description: 'Ganhar mais seguidores' },
  { id: 'sales', label: 'Vendas', description: 'Converter em vendas' },
  { id: 'authority', label: 'Autoridade', description: 'Estabelecer expertise no nicho' },
];

const tones = [
  { id: 'light', label: 'Leve', description: 'Descontraído e acessível' },
  { id: 'professional', label: 'Profissional', description: 'Formal e técnico' },
  { id: 'direct', label: 'Direto', description: 'Objetivo e sem rodeios' },
  { id: 'inspiring', label: 'Inspirador', description: 'Motivacional e empolgante' },
];

const contentTypes = [
  { id: 'script', label: 'Roteiro Completo', description: 'Hook, desenvolvimento e CTA estruturados' },
  { id: 'idea', label: 'Ideia de Conteúdo', description: 'Conceito e direcionamento estratégico' },
  { id: 'storytelling', label: 'Storytelling', description: 'Narrativa envolvente' },
];

export default function DashboardPage() {
  const [step, setStep] = useState<Step>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [content, setContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('content');
  const [isSaved, setIsSaved] = useState(false);

  const saveProject = (contentData: any) => {
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const platformLabels: { [key: string]: string } = {
        instagram: 'Instagram',
        tiktok: 'TikTok',
        youtube: 'YouTube',
        blog: 'Blog',
      };
      
      const newProject = {
        id: Date.now().toString(),
        title: `Conteúdo para ${platformLabels[selectedPlatform] || 'Plataforma'}`,
        platform: platformLabels[selectedPlatform] || 'Outro',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        items: 1,
        content: contentData,
        selectedPlatform,
        selectedObjective,
        selectedTone,
        selectedType,
      };
      
      projects.unshift(newProject); // Adiciona no início
      localStorage.setItem('projects', JSON.stringify(projects));
      return true;
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      return false;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simular geração de conteúdo
    setTimeout(() => {
      const generatedContent = {
        hook: 'Você já parou para pensar como o conteúdo que você consome molda suas decisões?',
        development: 'A verdade é que estamos constantemente sendo influenciados, mesmo sem perceber. Quando você entende isso, você pode criar conteúdo que realmente impacta a vida das pessoas de forma positiva.',
        cta: 'Compartilhe nos comentários: qual foi o último conteúdo que mudou sua perspectiva?'
      };
      setContent(generatedContent);
      setStep('result');
      setIsGenerating(false);
      // Salvar automaticamente
      const saved = saveProject(generatedContent);
      if (saved) {
        setTimeout(() => {
          setIsSaved(true);
        }, 500);
      }
    }, 2000);
  };

  const resetFlow = () => {
    setStep('platform');
    setSelectedPlatform('');
    setSelectedObjective('');
    setSelectedTone('');
    setSelectedType('');
    setContent(null);
    setIsSaved(false);
    setViewMode('content');
  };

  if (step === 'result' && content) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Seu Conteúdo</h1>
            {isSaved && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Projeto salvo automaticamente</span>
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={resetFlow} className="w-full sm:w-auto">
            Criar Novo
          </Button>
        </div>

        {viewMode === 'content' ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Hook Section */}
            <Card className="p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Hook</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-medium rounded-full">Primeiros 3 segundos</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  A primeira frase que captura a atenção. Deve ser impactante e fazer o leitor querer continuar lendo.
                </p>
              </div>
              <textarea
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                rows={3}
                defaultValue={content.hook}
                placeholder="Digite seu hook aqui..."
              />
            </Card>

            {/* Desenvolvimento Section */}
            <Card className="p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Desenvolvimento</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded-full">Corpo do conteúdo</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  Onde você desenvolve sua ideia, apresenta informações, conta uma história ou explica um conceito. É o coração do seu conteúdo.
                </p>
              </div>
              <textarea
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                rows={6}
                defaultValue={content.development}
                placeholder="Desenvolva sua ideia aqui..."
              />
            </Card>

            {/* CTA Section */}
            <Card className="p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">CTA</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium rounded-full">Call to Action</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  A ação que você quer que o leitor tome. Pode ser comentar, compartilhar, salvar, visitar um link ou qualquer outra ação específica.
                </p>
              </div>
              <textarea
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                rows={3}
                defaultValue={content.cta}
                placeholder="Qual ação você quer que o leitor tome?"
              />
            </Card>

            {/* CTA Button - Destaque */}
            <div className="flex justify-center pt-2 sm:pt-4">
              <Button 
                size="lg" 
                onClick={() => setViewMode('chat')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Conversar com IA para melhorar
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <ChatInterface initialContent={content} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Criar Conteúdo</h1>
        <p className="text-sm sm:text-base text-gray-600">Siga os passos para gerar conteúdo estruturado</p>
      </div>

      <div className="mb-6 sm:mb-8 overflow-x-auto">
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-max">
          {['platform', 'objective', 'tone', 'type'].map((s, index) => (
            <React.Fragment key={s}>
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                  step === s
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md'
                    : ['platform', 'objective', 'tone', 'type'].indexOf(step) > index
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`h-1 w-8 sm:w-12 md:w-16 rounded-full transition-all flex-shrink-0 ${
                    ['platform', 'objective', 'tone', 'type'].indexOf(step) > index
                      ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card>
        {step === 'platform' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Escolha a plataforma</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => {
                    setSelectedPlatform(platform.id);
                    setStep('objective');
                  }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-md transition-all text-center bg-white/50"
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2 flex items-center justify-center">
                    {platform.id === 'instagram' ? (
                      <div className="w-8 h-8 relative">
                        <Image
                          src="/images/cursos/icon_insta.png"
                          alt="Instagram"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    ) : platform.id === 'tiktok' ? (
                      <div className="w-8 h-8 relative">
                        <Image
                          src="/images/cursos/icon_tiktok.png"
                          alt="TikTok"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    ) : platform.id === 'youtube' ? (
                      <div className="w-8 h-8 relative">
                        <Image
                          src="/images/cursos/icon_youtube.png"
                          alt="YouTube"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    ) : platform.id === 'blog' ? (
                      <div className="w-8 h-8 relative">
                        <Image
                          src="/images/cursos/icon_blog.png"
                          alt="Blog"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      platform.icon
                    )}
                  </div>
                  <div className="font-medium text-sm sm:text-base text-gray-900">{platform.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'objective' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setStep('platform')}
                className="text-sm sm:text-base text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Qual o objetivo?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {objectives.map((objective) => (
                <button
                  key={objective.id}
                  onClick={() => {
                    setSelectedObjective(objective.id);
                    setStep('tone');
                  }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-md transition-all text-left bg-white/50"
                >
                  <div className="font-medium text-sm sm:text-base text-gray-900 mb-1">{objective.label}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{objective.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'tone' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setStep('objective')}
                className="text-sm sm:text-base text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tom de voz</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => {
                    setSelectedTone(tone.id);
                    setStep('type');
                  }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-md transition-all text-left bg-white/50"
                >
                  <div className="font-medium text-sm sm:text-base text-gray-900 mb-1">{tone.label}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{tone.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'type' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setStep('tone')}
                className="text-sm sm:text-base text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tipo de conteúdo</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    handleGenerate();
                  }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-md transition-all text-left bg-white/50"
                >
                  <div className="font-medium text-sm sm:text-base text-gray-900 mb-1">{type.label}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{type.description}</div>
                </button>
              ))}
            </div>
            {isGenerating && (
              <div className="text-center py-6 sm:py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-black"></div>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Gerando seu conteúdo...</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

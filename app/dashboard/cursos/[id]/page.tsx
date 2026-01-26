'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CourseImage } from '@/components/ui/CourseImage';
import { useUser } from '@/contexts/UserContext';

interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  thumbnail: string;
  isLocked: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: Module[];
  kiwifyId: string;
  kiwifyUrl: string;
  kiwifyDashboardUrl?: string; // URL do dashboard quando tem acesso
  isAvailable: boolean;
}

const mockCourses: Record<string, Course> = {
  '1': {
    id: '1',
    title: 'Roteiro Viral!',
    description: 'Aprenda a criar roteiros que viralizam e engajam sua audiência',
    thumbnail: '/images/cursos/roteiro-viral.jpeg',
    kiwifyId: 'YIUXqzV',
    kiwifyUrl: 'https://pay.kiwify.com.br/YIUXqzV?src=bionat',
    isAvailable: false,
    modules: [
      {
        id: '1',
        number: 1,
        title: 'Conhecendo as dores da sua audiência',
        description: 'Entenda como identificar e validar as dores reais da sua audiência',
        thumbnail: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=400',
        isLocked: false,
      },
      {
        id: '2',
        number: 2,
        title: 'Validação de proposta de valor',
        description: 'Aprenda a criar uma proposta de valor que realmente converte',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        isLocked: false,
      },
      {
        id: '3',
        number: 3,
        title: 'Gravando e estruturando seus conteúdos',
        description: 'Técnicas práticas para gravar e organizar seu conteúdo',
        thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
        isLocked: true,
      },
      {
        id: '4',
        number: 4,
        title: 'Plataformas de Pagamento',
        description: 'Conheça as melhores plataformas para receber pagamentos',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
        isLocked: true,
      },
      {
        id: '5',
        number: 5,
        title: 'Lançamento direto para demanda reprimida',
        description: 'Estratégias para lançar seu produto com sucesso',
        thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
        isLocked: true,
      },
      {
        id: '6',
        number: 6,
        title: 'Mentorias e agora?',
        description: 'Próximos passos após criar seu primeiro produto',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        isLocked: true,
      },
    ],
  },
  '2': {
    id: '2',
    title: 'H.P.A. - Hackeando Passagens Aéreas',
    description: 'Descubra estratégias para conseguir passagens aéreas com os melhores preços',
    thumbnail: '/images/cursos/hpa-passagens-aereas.png',
    kiwifyId: '96dk0GP',
    kiwifyUrl: 'https://pay.kiwify.com.br/96dk0GP',
    kiwifyDashboardUrl: 'https://dashboard.kiwify.com/course/premium/0c193809-a695-4f39-bc7b-b4e2794274a9',
    isAvailable: false,
    modules: [
      {
        id: '1',
        number: 1,
        title: 'Introdução ao Hackeamento de Passagens',
        description: 'Conceitos básicos e fundamentos para conseguir passagens mais baratas',
        thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
        isLocked: false,
      },
      {
        id: '2',
        number: 2,
        title: 'Ferramentas e Plataformas',
        description: 'Conheça as melhores ferramentas para encontrar passagens baratas',
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
        isLocked: false,
      },
      {
        id: '3',
        number: 3,
        title: 'Estratégias Avançadas',
        description: 'Técnicas avançadas para maximizar suas economias',
        thumbnail: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=400',
        isLocked: true,
      },
      {
        id: '4',
        number: 4,
        title: 'Milhas e Pontos',
        description: 'Como usar milhas e programas de fidelidade a seu favor',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
        isLocked: true,
      },
      {
        id: '5',
        number: 5,
        title: 'Dicas Práticas',
        description: 'Dicas práticas para aplicar no dia a dia',
        thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
        isLocked: true,
      },
      {
        id: '6',
        number: 6,
        title: 'Case Studies',
        description: 'Estudos de caso reais de sucesso',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        isLocked: true,
      },
      {
        id: '7',
        number: 7,
        title: 'Troubleshooting',
        description: 'Soluções para problemas comuns',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        isLocked: true,
      },
      {
        id: '8',
        number: 8,
        title: 'Próximos Passos',
        description: 'Como continuar economizando em viagens',
        thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
        isLocked: true,
      },
    ],
  },
  '3': {
    id: '3',
    title: 'Método Influência MILIONÁRIA',
    description: 'Domine as estratégias de influência para construir uma marca milionária',
    thumbnail: '/images/cursos/metodo-influencia-milionaria.png',
    kiwifyId: 'AQDrLac',
    kiwifyUrl: 'https://pay.kiwify.com.br/AQDrLac?src=bionat',
    kiwifyDashboardUrl: undefined, // Adicionar quando tiver o link do dashboard
    isAvailable: false,
    modules: [
      {
        id: '1',
        number: 1,
        title: 'Fundamentos da Influência',
        description: 'Entenda os princípios básicos da influência digital',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        isLocked: false,
      },
      {
        id: '2',
        number: 2,
        title: 'Construindo sua Autoridade',
        description: 'Como se posicionar como autoridade no seu nicho',
        thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
        isLocked: false,
      },
      {
        id: '3',
        number: 3,
        title: 'Estratégias de Monetização',
        description: 'Formas de monetizar sua influência',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
        isLocked: true,
      },
      {
        id: '4',
        number: 4,
        title: 'Parcerias e Colaborações',
        description: 'Como criar parcerias estratégicas',
        thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
        isLocked: true,
      },
      {
        id: '5',
        number: 5,
        title: 'Escalando para Milhões',
        description: 'Estratégias avançadas para escalar seu negócio',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        isLocked: true,
      },
    ],
  },
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento
    const foundCourse = mockCourses[courseId];
    if (foundCourse) {
      // Verificar assinatura
      checkCourseAccess(foundCourse);
    } else {
      setIsLoading(false);
    }
  }, [courseId, user.email]);

  const checkCourseAccess = async (courseData: Course) => {
    try {
      const response = await fetch('/api/kiwify/check-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      let hasAccess = false;
      if (response.ok) {
        const data = await response.json();
        hasAccess = data.courseIds?.includes(courseData.kiwifyId) || false;
      } else {
        // Para usuário de teste, dar acesso ao HPA
        if ((user.email === 'usuario@email.com' || user.email.includes('teste')) && courseData.kiwifyId === '96dk0GP') {
          hasAccess = true;
        }
      }
      
      setCourse({
        ...courseData,
        isAvailable: hasAccess,
        modules: courseData.modules.map((module, index) => ({
          ...module,
          isLocked: !hasAccess || index >= 2, // Primeiros 2 módulos liberados se tiver acesso
        })),
      });
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      // Para usuário de teste, dar acesso ao HPA
      if ((user.email === 'usuario@email.com' || user.email.includes('teste')) && courseData.kiwifyId === '96dk0GP') {
        setCourse({
          ...courseData,
          isAvailable: true,
          modules: courseData.modules.map((module, index) => ({
            ...module,
            isLocked: index >= 2,
          })),
        });
      } else {
        setCourse(courseData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3"></div>
          <div className="h-48 sm:h-64 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 sm:h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
        <Card className="text-center py-8 sm:py-12">
          <p className="text-sm sm:text-base text-gray-600 mb-4">Curso não encontrado</p>
          <Button onClick={() => router.push('/dashboard/cursos')} className="text-sm sm:text-base">
            Voltar para Cursos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => router.push('/dashboard/cursos')}
          className="text-sm sm:text-base text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 inline-flex items-center"
        >
          ← Voltar para Cursos
        </button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">{course.title}</h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600">{course.description}</p>
      </div>

      {/* Hero Section */}
      <Card className="mb-6 sm:mb-8 overflow-hidden">
        <div className="relative">
          <CourseImage
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-48 sm:h-64 md:h-96 rounded-xl"
          />
          {!course.isAvailable && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Curso Bloqueado</h3>
                <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6">Adquira este curso para ter acesso completo</p>
                <Button
                  size="lg"
                  onClick={() => window.open(course.kiwifyUrl, '_blank')}
                  className="text-sm sm:text-base"
                >
                  Adquirir Curso
                </Button>
              </div>
            </div>
          ) : (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              <Button
                onClick={() => {
                  if (course.kiwifyDashboardUrl) {
                    window.open(course.kiwifyDashboardUrl, '_blank');
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm md:text-base px-3 py-2 sm:px-6 sm:py-3"
              >
                Acessar no Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Módulos */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Módulos do Curso</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {course.modules.map((module) => (
            <Card
              key={module.id}
              className={`overflow-hidden transition-all duration-300 ${
                module.isLocked
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:shadow-xl cursor-pointer'
              }`}
              onClick={() => {
                if (!module.isLocked && course.isAvailable) {
                  // Se tem acesso, redirecionar para o dashboard da Kiwify
                  if (course.kiwifyDashboardUrl) {
                    window.open(course.kiwifyDashboardUrl, '_blank');
                  }
                }
              }}
            >
              <div className="relative">
                <CourseImage
                  src={module.thumbnail}
                  alt={module.title}
                  className="w-full h-32 sm:h-40"
                />
                {module.isLocked && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <span className="bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-gray-900">
                    MÓDULO {module.number}
                  </span>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">{module.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{module.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

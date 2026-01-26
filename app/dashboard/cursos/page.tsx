'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CourseImage } from '@/components/ui/CourseImage';
import { useUser } from '@/contexts/UserContext';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: number;
  kiwifyId: string;
  kiwifyUrl: string;
  kiwifyDashboardUrl?: string; // URL do dashboard quando tem acesso
  isAvailable: boolean;
}

export default function CursosPage() {
  const { user } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de cursos
    const mockCourses: Course[] = [
      {
        id: '1',
        title: 'Roteiro Viral!',
        description: 'Aprenda a criar roteiros que viralizam e engajam sua audiência',
        thumbnail: '/images/cursos/roteiro-viral.jpeg',
        modules: 6,
        kiwifyId: 'YIUXqzV',
        kiwifyUrl: 'https://pay.kiwify.com.br/YIUXqzV?src=bionat',
        isAvailable: false, // Será verificado via API
      },
      {
        id: '2',
        title: 'H.P.A. - Hackeando Passagens Aéreas',
        description: 'Descubra estratégias para conseguir passagens aéreas com os melhores preços',
        thumbnail: '/images/cursos/hpa-passagens-aereas.png',
        modules: 8,
        kiwifyId: '96dk0GP',
        kiwifyUrl: 'https://pay.kiwify.com.br/96dk0GP',
        kiwifyDashboardUrl: 'https://dashboard.kiwify.com/course/premium/0c193809-a695-4f39-bc7b-b4e2794274a9',
        isAvailable: false,
      },
      {
        id: '3',
        title: 'Método Influência MILIONÁRIA',
        description: 'Domine as estratégias de influência para construir uma marca milionária',
        thumbnail: '/images/cursos/metodo-influencia-milionaria.png',
        modules: 5,
        kiwifyId: 'AQDrLac',
        kiwifyUrl: 'https://pay.kiwify.com.br/AQDrLac?src=bionat',
        isAvailable: false,
      },
    ];

    // Verificar assinaturas via API da Kiwify
    checkKiwifySubscriptions(mockCourses);
  }, [user.email]);

  const checkKiwifySubscriptions = async (coursesList: Course[]) => {
    setIsLoading(true);
    try {
      // TODO: Substituir por chamada real à API da Kiwify
      // Exemplo: const response = await fetch(`/api/kiwify/check-subscriptions?email=${user.email}`);
      
      // Simulação: verificar assinaturas
      // Em produção, isso viria da API da Kiwify
      const availableCourseIds = await fetchKiwifySubscriptions(user.email);
      
      const updatedCourses = coursesList.map(course => ({
        ...course,
        isAvailable: availableCourseIds.includes(course.kiwifyId),
      }));

      setCourses(updatedCourses);
    } catch (error) {
      console.error('Erro ao verificar assinaturas:', error);
      setCourses(coursesList);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar assinaturas da Kiwify
  const fetchKiwifySubscriptions = async (email: string): Promise<string[]> => {
    try {
      const response = await fetch('/api/kiwify/check-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao verificar assinaturas');
      }
      
      const data = await response.json();
      return data.courseIds || []; // Array de IDs dos cursos disponíveis
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      // Para usuário de teste, retornar acesso ao HPA
      if (email === 'usuario@email.com' || email.includes('teste')) {
        return ['96dk0GP']; // ID do HPA
      }
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Cursos</h1>
          <p className="text-sm sm:text-base text-gray-600">Monetize seu conhecimento</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 sm:h-48 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
      {/* Hero Section */}
      <div className="mb-6 sm:mb-8 md:mb-12 text-center">
        <div className="inline-flex items-center space-x-2 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Cursos</h1>
        </div>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
          Monetize seu conhecimento. Aprenda como realizar suas primeiras vendas como expert para sua audiência.
        </p>
      </div>

      {/* Cursos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-4">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <CourseImage
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-40 sm:h-48 rounded-t-xl"
              />
              {!course.isAvailable && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center px-2">
                    <svg
                      className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-2"
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
                    <p className="text-white text-sm sm:text-base font-medium">Curso Bloqueado</p>
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium text-gray-900">
                  {course.modules} módulos
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{course.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{course.description}</p>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                {course.isAvailable ? (
                  <Button
                    className="w-full text-sm sm:text-base"
                    onClick={() => {
                      // Se tem acesso, pode ir para detalhes ou direto para dashboard
                      if (course.kiwifyDashboardUrl) {
                        window.open(course.kiwifyDashboardUrl, '_blank');
                      } else {
                        window.location.href = `/dashboard/cursos/${course.id}`;
                      }
                    }}
                  >
                    Acessar Curso
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full text-sm sm:text-base"
                    onClick={() => window.open(course.kiwifyUrl, '_blank')}
                  >
                    Adquirir Curso
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {courses.length === 0 && !isLoading && (
        <Card className="text-center py-8 sm:py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Nenhum curso disponível
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            Novos cursos em breve!
          </p>
        </Card>
      )}
    </div>
  );
}

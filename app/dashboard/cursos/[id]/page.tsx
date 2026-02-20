'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import { useCourses } from '@/contexts/CoursesContext';
import { CourseImage } from '@/components/ui/CourseImage';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Skeleton,
  Stack,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Description as DescriptionIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { courseIdsIncludeCourse } from '@/lib/courses';

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
  kiwifyUrl: string;
  kiwifyDashboardUrl?: string;
  kiwifyProductIds?: string[];
  isAvailable: boolean;
}

const mockCourses: Record<string, Course> = {
  '1': {
    id: '1',
    title: 'Roteiro Viral!',
    description: 'Aprenda a criar roteiros que viralizam e engajam sua audiência',
    thumbnail: '/images/cursos/roteiro-viral.jpeg',
    kiwifyUrl: 'https://pay.kiwify.com.br/YIUXqzV?afid=kq3Wqjlq',
    kiwifyDashboardUrl: 'https://members.kiwify.com/?club=8b89b9db-3ff5-42ef-9abd-52a655725a84',
    kiwifyProductIds: ['080a7190-ae0f-11f0-84ca-83ece070bd1d', 'YIUXqzV', '8b89b9db-3ff5-42ef-9abd-52a655725a84'],
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
    kiwifyUrl: 'https://pay.kiwify.com.br/96dk0GP?afid=rXWOYDG7',
    kiwifyDashboardUrl: 'https://dashboard.kiwify.com/course/premium/0c193809-a695-4f39-bc7b-b4e2794274a9',
    kiwifyProductIds: ['c6547980-bb2e-11f0-8751-cd4e443e2330', '97204820-d3e9-11ee-b35b-a7756e800fa3', 'b1d89730-3533-11ee-84fd-bdb8d3fd9bc7', 'yjHjvnY', 'cGQaf5s', '0c193809-a695-4f39-bc7b-b4e2794274a9'],
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
    kiwifyUrl: 'https://pay.kiwify.com.br/AQDrLac?afid=10z1btuv',
    kiwifyDashboardUrl: 'https://dashboard.kiwify.com/course/premium/66c42290-49a6-41d6-95e1-2d62c37f0078',
    kiwifyProductIds: ['b28b7a90-b4cf-11ef-9456-6daddced3267', '6683aa80-bb2e-11f0-a386-7f084bbfb234', '92ff3db0-b1ea-11f0-8ead-2342e472677a', '0pZo7Fz', 'sXB7hnD', '66c42290-49a6-41d6-95e1-2d62c37f0078'],
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
  const { account } = useAccount();
  const { hasCourse, courseIds, loading: coursesLoading } = useCourses();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (coursesLoading) return;
    const foundCourse = mockCourses[courseId];
    if (!foundCourse) {
      setIsLoading(false);
      return;
    }
    const hasAccess = hasCourse(foundCourse);
    setCourse({
      ...foundCourse,
      isAvailable: hasAccess,
      modules: foundCourse.modules.map((module, index) => ({
        ...module,
        isLocked: !hasAccess || index >= 2,
      })),
    });
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, courseIds, coursesLoading]);

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1152, mx: 'auto', px: { xs: 2, sm: 3 }, pb: { xs: 12, sm: 4 } }}>
        <Stack spacing={3}>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="rounded" height={300} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                <Skeleton variant="rounded" height={180} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ maxWidth: 1152, mx: 'auto', px: { xs: 2, sm: 3 }, pb: { xs: 12, sm: 4 } }}>
        <Paper sx={{ py: { xs: 4, sm: 6 }, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Curso não encontrado
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/dashboard/cursos')}
          >
            Voltar para Cursos
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1152, mx: 'auto', px: { xs: 2, sm: 3 }, pb: { xs: 12, sm: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/cursos')}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Voltar para Cursos
        </Button>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' } }}
        >
          {course.title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}
        >
          {course.description}
        </Typography>
      </Box>

      {/* Hero Section */}
      <Paper sx={{ mb: { xs: 3, sm: 4 }, overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ position: 'relative' }}>
          <CourseImage
            src={course.thumbnail}
            alt={course.title}
            className="w-full object-cover"
          />
          {!course.isAvailable ? (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ textAlign: 'center', color: 'white', px: 2 }}>
                <LockIcon sx={{ fontSize: { xs: 64, sm: 80 }, mb: 2, opacity: 0.9 }} />
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Curso Bloqueado
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Adquira este curso para ter acesso completo
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => window.open(course.kiwifyUrl, '_blank')}
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    },
                  }}
                >
                  Adquirir Curso
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 } }}>
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() => {
                  if (course.kiwifyDashboardUrl) {
                    window.open(course.kiwifyDashboardUrl, '_blank');
                  }
                }}
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Acessar no Dashboard
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Modules Section */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Box
            sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DescriptionIcon sx={{ color: 'white', fontSize: { xs: 16, sm: 20 } }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
            Módulos do Curso
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          {course.modules.map((module) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={module.id}>
              <Paper
                sx={{
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  opacity: module.isLocked ? 0.75 : 1,
                  cursor: module.isLocked ? 'not-allowed' : 'pointer',
                  '&:hover': module.isLocked ? {} : {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => {
                  if (!module.isLocked && course.isAvailable && course.kiwifyDashboardUrl) {
                    window.open(course.kiwifyDashboardUrl, '_blank');
                  }
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CourseImage
                    src={module.thumbnail}
                    alt={module.title}
                    className="w-full h-32 object-cover"
                  />
                  {module.isLocked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LockIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'white' }} />
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Chip
                      label={`MÓDULO ${module.number}`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {module.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {module.description}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

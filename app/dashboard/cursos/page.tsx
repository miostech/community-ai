'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { useCourses } from '@/contexts/CoursesContext';

// MUI imports
import {
  AppBar,
  Toolbar,
  Avatar,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Skeleton,
  Grid,
  Stack,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { courseIdsIncludeCourse } from '@/lib/courses';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: number;
  kiwifyUrl: string;
  kiwifyDashboardUrl?: string;
  /** IDs do produto (slugs ou UUID) para conferir se comprou */
  kiwifyProductIds?: string[];
  isAvailable: boolean;
}

export default function CursosPage() {
  const { hasCourse, courseIds, loading: coursesLoading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mockCourses: Course[] = [
    {
      id: '3',
      title: 'Método Influência MILIONÁRIA',
      description: 'Domine as estratégias de influência para construir uma marca milionária',
      thumbnail: '/images/cursos/metodo-influencia-milionaria.png',
      modules: 5,
      kiwifyUrl: 'https://pay.kiwify.com.br/AQDrLac?afid=10z1btuv',
      kiwifyDashboardUrl: 'https://dashboard.kiwify.com/course/premium/66c42290-49a6-41d6-95e1-2d62c37f0078',
      kiwifyProductIds: ['b28b7a90-b4cf-11ef-9456-6daddced3267', '6683aa80-bb2e-11f0-a386-7f084bbfb234', '92ff3db0-b1ea-11f0-8ead-2342e472677a', '0pZo7Fz', 'sXB7hnD', '66c42290-49a6-41d6-95e1-2d62c37f0078'],
      isAvailable: false,
    },
    {
      id: '1',
      title: 'Roteiro Viral!',
      description: 'Aprenda a criar roteiros que viralizam e engajam sua audiência',
      thumbnail: '/images/cursos/roteiro-viral.jpeg',
      modules: 6,
      kiwifyUrl: 'https://pay.kiwify.com.br/YIUXqzV?afid=kq3Wqjlq',
      kiwifyDashboardUrl: 'https://members.kiwify.com/?club=8b89b9db-3ff5-42ef-9abd-52a655725a84',
      kiwifyProductIds: ['080a7190-ae0f-11f0-84ca-83ece070bd1d', 'YIUXqzV', '8b89b9db-3ff5-42ef-9abd-52a655725a84'],
      isAvailable: false,
    },
    {
      id: '2',
      title: 'H.P.A. - Hackeando Passagens Aéreas',
      description: 'Descubra estratégias para conseguir passagens aéreas com os melhores preços',
      thumbnail: '/images/cursos/hpa-passagens-aereas.png',
      modules: 8,
      kiwifyUrl: 'https://pay.kiwify.com.br/96dk0GP?afid=rXWOYDG7',
      kiwifyDashboardUrl: 'https://dashboard.kiwify.com/course/premium/0c193809-a695-4f39-bc7b-b4e2794274a9',
      kiwifyProductIds: ['c6547980-bb2e-11f0-8751-cd4e443e2330', '97204820-d3e9-11ee-b35b-a7756e800fa3', 'b1d89730-3533-11ee-84fd-bdb8d3fd9bc7', 'yjHjvnY', 'cGQaf5s', '0c193809-a695-4f39-bc7b-b4e2794274a9'],
      isAvailable: false,
    },
  ];

  // Atualiza isAvailable sempre que o contexto de cursos mudar
  useEffect(() => {
    if (coursesLoading) return;
    const updated = mockCourses.map((course) => ({
      ...course,
      isAvailable: hasCourse(course),
    }));
    setCourses(updated);
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIds, coursesLoading]);

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1152, mx: 'auto', pb: { xs: 12, sm: 4 } }}>
        <AppBar
          position="fixed"
          sx={{
            width: { xs: '100%', md: 'calc(100% - 256px)' },
          }}
        >
          <Box sx={{ maxWidth: 1152, mx: 'auto', width: '100%' }}>
            <Toolbar sx={{ px: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  <MenuBookIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Cursos
                </Typography>
              </Stack>
            </Toolbar>
          </Box>
        </AppBar>
        <Toolbar />
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
              <Card sx={{ borderRadius: 3 }}>
                <Skeleton variant="rectangular" height={192} />
                <CardContent>
                  <Skeleton variant="text" width="75%" height={28} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1152, mx: 'auto', pb: { xs: 12, sm: 4 } }}>
      {/* AppBar Fixo */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: 'calc(100% - 256px)' },
        }}
      >
        <Box sx={{ maxWidth: 1152, mx: 'auto', width: '100%' }}>
          <Toolbar sx={{ px: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                <MenuBookIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Cursos
              </Typography>
            </Stack>
          </Toolbar>
        </Box>
      </AppBar>

      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

      {/* Descrição */}
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 600,
            mx: 'auto',
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
          }}
        >
          Aprenda a criar conteúdo que vende, construa sua marca de forma orgânica e transforme suas redes sociais em uma fonte real de renda.
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 } }}>

        {/* Courses Grid */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {courses.map((course) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={course.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                {/* Image */}
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={course.thumbnail}
                    alt={course.title}
                    sx={{
                      height: { xs: 160, sm: 192 },
                      objectFit: 'cover',
                      objectPosition: { xs: 'top', sm: 'center' },
                      filter: !course.isAvailable ? 'grayscale(20%)' : 'none',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cursos/placeholder.jpg';
                    }}
                  />
                  {!course.isAvailable && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(255,255,255,0.2)',
                      }}
                    />
                  )}
                  <Chip
                    label={`${course.modules} módulos`}
                    size="small"
                    sx={(theme) => ({
                      position: 'absolute',
                      top: { xs: 8, sm: 12 },
                      right: { xs: 8, sm: 12 },
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                      color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.grey[900],
                      backdropFilter: 'blur(8px)',
                      fontSize: { xs: '0.625rem', sm: '0.75rem' },
                      fontWeight: 500,
                    })}
                  />
                </Box>

                {/* Content */}
                <CardContent sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      mb: 1,
                      fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                    }}
                  >
                    {course.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.6,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {course.description}
                  </Typography>
                </CardContent>

                {/* Actions */}
                <CardActions
                  sx={{
                    p: { xs: 2, sm: 3 },
                    pt: 0,
                    borderTop: 1,
                    borderColor: 'divider',
                    mt: 'auto',
                  }}
                >
                  {course.isAvailable ? (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => {
                        if (course.kiwifyDashboardUrl) {
                          window.open(course.kiwifyDashboardUrl, '_blank');
                        } else {
                          window.location.href = `/dashboard/cursos/${course.id}`;
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        py: { xs: 1, sm: 1.25 },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Acessar Curso
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => window.open(course.kiwifyUrl, '_blank')}
                      sx={{
                        borderRadius: 2,
                        py: { xs: 1, sm: 1.25 },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Adquirir Curso
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty state */}
        {courses.length === 0 && !isLoading && (
          <Card sx={{ textAlign: 'center', py: { xs: 4, sm: 6 }, borderRadius: 3 }}>
            <Box
              sx={{
                width: { xs: 48, sm: 64 },
                height: { xs: 48, sm: 64 },
                mx: 'auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: 'action.hover',
              }}
            >
              <MenuBookIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'text.disabled' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              Nenhum curso disponível
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Novos cursos em breve!
            </Typography>
          </Card>
        )}
      </Box>
    </Box>
  );
}

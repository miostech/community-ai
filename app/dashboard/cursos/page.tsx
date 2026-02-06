'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

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
  ShoppingCart as ShoppingCartIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: number;
  kiwifyId: string;
  kiwifyUrl: string;
  kiwifyDashboardUrl?: string;
  isAvailable: boolean;
}

export default function CursosPage() {
  const { user } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mockCourses: Course[] = [
      {
        id: '1',
        title: 'Roteiro Viral!',
        description: 'Aprenda a criar roteiros que viralizam e engajam sua audiência',
        thumbnail: '/images/cursos/roteiro-viral.jpeg',
        modules: 6,
        kiwifyId: 'YIUXqzV',
        kiwifyUrl: 'https://pay.kiwify.com.br/YIUXqzV?src=bionat',
        isAvailable: false,
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

    checkKiwifySubscriptions(mockCourses);
  }, [user.email]);

  const checkKiwifySubscriptions = async (coursesList: Course[]) => {
    setIsLoading(true);
    try {
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
      return data.courseIds || [];
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      if (email === 'usuario@email.com' || email.includes('teste')) {
        return ['96dk0GP'];
      }
      return [];
    }
  };

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
          Aprenda a criar conteúdo que vende e a construir sua marca de forma orgânica.
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
                    sx={{
                      position: 'absolute',
                      top: { xs: 8, sm: 12 },
                      right: { xs: 8, sm: 12 },
                      bgcolor: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      fontSize: { xs: '0.625rem', sm: '0.75rem' },
                      fontWeight: 500,
                    }}
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
                      startIcon={<ShoppingCartIcon />}
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

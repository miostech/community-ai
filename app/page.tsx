'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { DomeLogo } from '@/components/ui/DomeLogo';
import {
  Box,
  Container,
  Typography,
  TextField,
  IconButton,
  Chip,
  Avatar,
  AvatarGroup,
  Paper,
  Stack,
  Grid,
  Button,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  LightbulbOutlined as LightbulbIcon,
  ChatBubbleOutline as ChatIcon,
  GroupOutlined as GroupIcon,
  LocalFireDepartmentOutlined as TrendingIcon,
  PersonOutline as PersonIcon,
  CampaignOutlined as CampaignIcon,
  TuneOutlined as TuneIcon,
  HandshakeOutlined as HandshakeIcon,
  InsightsOutlined as InsightsIcon,
  EditNoteOutlined as EditNoteIcon,
  SearchOutlined as SearchIcon,
  HowToRegOutlined as HowToRegIcon,
  BarChartOutlined as BarChartIcon,
} from '@mui/icons-material';

const suggestedPrompts = [
  'Criar roteiro para Reels',
  'Ideia de post viral',
  'Storytelling pessoal',
  'Conteúdo educativo',
  'Venda sem parecer venda',
];

const InstagramIcon = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a4.85 4.85 0 0 0 3.77 4.22v-3.29a4.85 4.85 0 0 1-1-.4z" />
  </svg>
);

const recursos = [
  {
    icon: <LightbulbIcon />,
    color: 'primary' as const,
    bgColor: 'primary.main',
    title: 'Ideias Estruturadas',
    description: 'Receba ideias de como melhorar seu conteúdo, ganhar engajamento e conversão pra você se tornar um criador de conteúdo de sucesso.',
  },
  {
    icon: <ChatIcon />,
    color: 'secondary' as const,
    bgColor: '#ec4899',
    title: 'Chat com IA',
    description: 'Converse com a IA treinada pela Natália e pelo Luigi, ela será sua assistente de criação de conteúdo.',
  },
  {
    icon: <GroupIcon />,
    color: 'success' as const,
    bgColor: 'success.main',
    title: 'Comunidade',
    description: 'Faça parte de uma comunidade de criadores de conteúdo que buscam melhorar, se inspirar e se apoiar mutuamente. Tire suas dúvidas, compartilhe suas ideias e seja inspirado por outros criadores.',
  },
  {
    icon: <TrendingIcon />,
    color: 'warning' as const,
    bgColor: 'warning.main',
    title: 'Temas em Alta',
    description: 'Saiba quais são os assuntos que estão em alta no momento, que estão gerando muito engajamento e conversão pra você se inspirar.',
  },
];

function formatFollowers(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `+${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',')} milhão`;
  }
  if (n >= 1_000) {
    return `+${Math.floor(n / 1_000)} mil`;
  }
  return `+${n}`;
}

const criadores = [
  {
    nome: 'Natália Trombelli',
    usuario: '@natrombellii',
    seguidoresFallback: '+1.1 milhão',
    foto: '/images/cursos/natalia-trombelli.png',
    imgPosition: '35% center',
    descricao: 'Criadora de conteúdo especializada em estratégias de engajamento e crescimento orgânico. Compartilha conhecimento prático sobre criação de conteúdo que converte.',
    instagram: 'https://instagram.com/natrombellii',
    tiktok: 'https://tiktok.com/@natrombellii',
    igUser: 'natrombellii',
    ttUser: 'natrombellii',
  },
  {
    nome: 'Luigi Andersen',
    usuario: '@luigi.andersen',
    seguidoresFallback: '+772 mil',
    foto: '/images/cursos/luigi-andersen.png',
    imgPosition: '65% center',
    descricao: 'Especialista em criação de conteúdo estratégico e monetização. Ajuda criadores a transformarem sua paixão em negócio através de conteúdo de valor.',
    instagram: 'https://instagram.com/luigi.andersen',
    tiktok: 'https://tiktok.com/@luigi.andersen',
    igUser: 'luigi.andersen',
    ttUser: 'luigi.andersen',
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [placeholderText, setPlaceholderText] = useState('');
  const [followersMap, setFollowersMap] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fullPlaceholder = 'Crie ideias de conteúdo para Instagram';

  // Redireciona usuários autenticados para o dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard/comunidade');
    }
  }, [status, router]);

  useEffect(() => {
    const CACHE_KEY = 'criadores_followers';
    const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setFollowersMap(data);
          return;
        }
      }
    } catch { /* ignore */ }

    Promise.all(
      criadores.map(async (c) => {
        try {
          const params = new URLSearchParams();
          if (c.igUser) params.set('instagram', c.igUser);
          if (c.ttUser) params.set('tiktok', c.ttUser);
          const res = await fetch(`/api/social-stats?${params.toString()}`);
          if (!res.ok) return null;
          const json = await res.json();
          const total = json.totalFollowers as number;
          return total > 0 ? { key: c.igUser, label: formatFollowers(total) } : null;
        } catch { return null; }
      })
    ).then((results) => {
      const map: Record<string, string> = {};
      for (const r of results) {
        if (r) map[r.key] = r.label;
      }
      if (Object.keys(map).length > 0) {
        setFollowersMap(map);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: map, ts: Date.now() }));
        } catch { /* ignore */ }
      }
    });
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullPlaceholder.length) {
        setPlaceholderText(fullPlaceholder.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [fullPlaceholder]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const firstHalf = container.children.length / 2;
      const firstHalfWidth = Array.from(container.children)
        .slice(0, firstHalf)
        .reduce((sum, child) => sum + (child as HTMLElement).offsetWidth + 8, 0);

      container.style.setProperty('--scroll-width', `${firstHalfWidth}px`);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      window.location.href = '/precos';
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => {
      window.location.href = '/precos';
    }, 100);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
      {/* Background decorative elements */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Box
          sx={{
            position: 'absolute', top: 80, left: 40,
            width: 288, height: 288,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute', top: 160, right: 40,
            width: 288, height: 288,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.secondary.main, 0.12),
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: -32, left: '50%',
            width: 288, height: 288,
            borderRadius: '50%',
            bgcolor: alpha('#ec4899', 0.12),
            filter: 'blur(60px)',
          }}
        />
      </Box>

      <Header />

      {/* Hero Section */}
      <Container
        maxWidth="md"
        component="section"
        sx={{
          position: 'relative',
          pt: { xs: 12, sm: 16, md: 20 },
          pb: { xs: 6, sm: 10, md: 16 },
        }}
      >
        <Stack alignItems="center" spacing={{ xs: 3, sm: 4 }}>
          {/* Logo + Slogan do Método */}
          <Stack alignItems="center" spacing={1.5}>
            <DomeLogo
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
              }}
            />
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                letterSpacing: '0.12em',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
              }}
            >
              Método do Zero ao Milhão
            </Typography>
          </Stack>

          {/* Headline */}
          <Stack spacing={1.5} alignItems="center" sx={{ px: 1 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.875rem', sm: '2.25rem', md: '3rem', lg: '3.75rem' },
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.15,
                color: 'text.primary',
              }}
            >
              A primeira cúpula de criadores de conteúdo
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                color: 'text.secondary',
                maxWidth: 720,
                textAlign: 'center',
                lineHeight: 1.6,
                fontWeight: 400,
                px: { xs: 1, sm: 2 },
              }}
            >
              A Dome é uma comunidade exclusiva para criadores que querem crescer com estratégia, consistência e autoridade nas redes. Aqui você troca estratégias com criadores comprometidos e acessa uma IA exclusiva, treinada por eles, para orientar ideias, posicionamento e evolução.
              <br />
              Construa autoridade de forma intencional.
            </Typography>
          </Stack>

          {/* Main Input */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            suppressHydrationWarning
            sx={{ width: '100%', maxWidth: 720, mt: { xs: 2, sm: 4 }, px: { xs: 1, sm: 0 } }}
          >
            <Paper
              elevation={4}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: { xs: 0.5, sm: 0.75 },
                borderRadius: { xs: 3, sm: 4 },
                border: 2,
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: alpha(theme.palette.text.secondary, 0.3),
                },
                '&:focus-within': {
                  borderColor: 'primary.main',
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              }}
            >
              <TextField
                fullWidth
                variant="standard"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholderText || 'Crie ideias de conteúdo para Instagram'}
                suppressHydrationWarning
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                    px: { xs: 1.5, sm: 3 },
                    py: { xs: 1.5, sm: 2 },
                  },
                }}
              />
              <IconButton
                type="submit"
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: { xs: 2, sm: 3 },
                  mr: 0.5,
                  flexShrink: 0,
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: 4,
                  },
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Paper>
          </Box>

          {/* Suggested Prompts */}
          <Stack spacing={1} sx={{ mt: 1, width: '100%', maxWidth: 720, px: { xs: 1, sm: 0 } }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Sem ideias? Tente uma destas opções:
            </Typography>
            <Box sx={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
              <Box
                ref={scrollContainerRef}
                className="animate-scroll"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                {[...suggestedPrompts, ...suggestedPrompts].map((prompt, index) => (
                  <Chip
                    key={index}
                    label={prompt}
                    variant="outlined"
                    onClick={() => handlePromptClick(prompt)}
                    sx={{
                      borderColor: 'divider',
                      bgcolor: alpha(theme.palette.text.primary, 0.02),
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      height: { xs: 30, sm: 34 },
                      cursor: 'pointer',
                      flexShrink: 0,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.text.primary, 0.06),
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>

          {/* Social Proof */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ mt: { xs: 3, sm: 5, md: 7 } }}
          >
            <AvatarGroup
              max={3}
              sx={{
                '& .MuiAvatar-root': {
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  border: `2px solid ${theme.palette.background.default}`,
                  fontSize: 14,
                },
              }}
            >
              <Avatar sx={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)' }} />
              <Avatar sx={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }} />
              <Avatar sx={{ background: 'linear-gradient(135deg, #f472b6, #db2777)' }} />
            </AvatarGroup>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                +24 mil
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Alunos criando conteúdo
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Container>

      {/* Criadores Section */}
      <Container
        maxWidth="md"
        component="section"
        id="criadores"
        sx={{ position: 'relative', pt: { xs: 3, sm: 4 }, pb: { xs: 4, sm: 6 } }}
      >
        <Stack alignItems="center" spacing={1.5} sx={{ mb: { xs: 4, sm: 6 } }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem' },
              fontWeight: 700,
              textAlign: 'center',
              color: 'text.primary',
            }}
          >
            Criado por especialistas em conteúdo
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: 'text.secondary',
              maxWidth: 560,
              textAlign: 'center',
            }}
          >
            Que já alcançaram mais de 1 milhão de seguidores e estão dispostos a compartilhar seus conhecimentos com você.
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 3, sm: 4 }} sx={{ maxWidth: 900, mx: 'auto' }}>
          {criadores.map((criador) => (
            <Grid size={{ xs: 12, md: 6 }} key={criador.nome}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderRadius: 3,
                  textAlign: 'center',
                  border: 1,
                  borderColor: 'divider',
                  backdropFilter: 'blur(12px)',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <Stack alignItems="center" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      width: { xs: 80, sm: 96 },
                      height: { xs: 80, sm: 96 },
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2px solid ${theme.palette.divider}`,
                      mb: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      component="img"
                      src={criador.foto}
                      alt={criador.nome}
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover',
                        objectPosition: criador.imgPosition ?? 'center center',
                      }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {criador.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {criador.usuario}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {followersMap[criador.igUser] ?? criador.seguidoresFallback}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      seguidores
                    </Typography>
                  </Stack>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7, mb: { xs: 2, sm: 3 } }}
                >
                  {criador.descricao}
                </Typography>

                <Stack direction="row" justifyContent="center" spacing={2}>
                  <IconButton
                    component="a"
                    href={criador.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: 'text.disabled',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <InstagramIcon />
                  </IconButton>
                  <IconButton
                    component="a"
                    href={criador.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: 'text.disabled',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <TikTokIcon />
                  </IconButton>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Recursos Section */}
      <Container
        maxWidth="lg"
        component="section"
        id="recursos"
        sx={{ position: 'relative', py: { xs: 6, sm: 8, md: 10 } }}
      >
        <Stack alignItems="center" spacing={1.5} sx={{ mb: { xs: 4, sm: 6, md: 8 } }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem' },
              fontWeight: 700,
              textAlign: 'center',
              color: 'text.primary',
            }}
          >
            Recursos
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: 'text.secondary',
              maxWidth: 560,
              textAlign: 'center',
            }}
          >
            Tudo que você precisa para criar conteúdo que converte e gera resultados.
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {recursos.map((recurso) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={recurso.title}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  backdropFilter: 'blur(12px)',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: { xs: 1.5, sm: 2 },
                    bgcolor: alpha(
                      typeof recurso.bgColor === 'string' && recurso.bgColor.includes('.')
                        ? theme.palette[recurso.color]?.main || recurso.bgColor
                        : recurso.bgColor,
                      0.12
                    ),
                    color: typeof recurso.bgColor === 'string' && recurso.bgColor.includes('.')
                      ? `${recurso.color}.main`
                      : recurso.bgColor,
                  }}
                >
                  {recurso.icon}
                </Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                  sx={{ mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  {recurso.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                >
                  {recurso.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Para Marcas — Hero */}
      <Box
        component="section"
        id="marcas"
        sx={{
          position: 'relative',
          pt: { xs: 8, sm: 10, md: 14 },
          pb: { xs: 4, sm: 6, md: 8 },
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha('#ec4899', 0.06)} 50%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          {/* Headline */}
          <Stack alignItems="center" spacing={2} sx={{ mb: { xs: 6, sm: 8, md: 10 } }}>
            <Chip
              label="Para Marcas"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.04em',
                height: 32,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                fontWeight: 700,
                textAlign: 'center',
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              Um novo conceito de{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #2563eb, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                marketing de influência
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.35rem' },
                color: 'text.secondary',
                maxWidth: 720,
                textAlign: 'center',
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              Conectamos sua marca com mais de{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                20 mil criadores de conteúdo
              </Box>
              .{' '}Uma plataforma onde você cria campanhas, filtra creators e escolhe quem vai dar voz à sua marca.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              component="a"
              href="https://wa.me/5511964056099?text=Ol%C3%A1%2C%20sou%20uma%20marca%20e%20quero%20criar%20uma%20campanha%20com%20ajuda%20de%20um%20especialista"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                mt: 2,
                px: { xs: 4, sm: 5 },
                py: { xs: 1.2, sm: 1.5 },
                borderRadius: 3,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                boxShadow: `0 4px 20px ${alpha('#2563eb', 0.35)}`,
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                  boxShadow: `0 6px 28px ${alpha('#2563eb', 0.45)}`,
                },
              }}
            >
              Agendar apresentação
            </Button>
          </Stack>

          {/* Criação de conteúdo para... */}
          <Stack alignItems="center" spacing={1.5} sx={{ mb: { xs: 4, sm: 5 } }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' },
                fontWeight: 700,
                textAlign: 'center',
                color: 'text.primary',
              }}
            >
              Criação de conteúdo para:
            </Typography>
          </Stack>

          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 6, sm: 8, md: 10 } }}>
            {[
              {
                icon: <InstagramIcon />,
                color: '#ec4899',
                title: 'Suas Redes Sociais',
                description:
                  'Criadores produzem conteúdo autêntico e nativo de cada plataforma, aumentando o engajamento orgânico da sua marca.',
              },
              {
                icon: <CampaignIcon sx={{ fontSize: 22 }} />,
                color: '#2563eb',
                title: 'Anúncios e Tráfego Pago',
                description:
                  'Conteúdos feitos por creators geram taxas de clique até 4x maiores e reduzem em 50% o custo por clique nos seus anúncios.',
              },
              {
                icon: <GroupIcon sx={{ fontSize: 22 }} />,
                color: '#8b5cf6',
                title: 'Publicidade nas Redes Sociais',
                description:
                  'Utilize a audiência de micro e nano influencers para expandir o alcance da sua marca com conteúdo genuíno.',
              },
            ].map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 3.5 },
                    borderRadius: 4,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(16px)',
                    height: '100%',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: alpha(item.color, 0.3),
                      boxShadow: `0 8px 32px ${alpha(item.color, 0.12)}`,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      bgcolor: alpha(item.color, 0.1),
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ mb: 0.5, fontSize: { xs: '1rem', sm: '1.05rem' } }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.75, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
                  >
                    {item.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Plataforma conecta — Filtros visuais */}
          <Stack alignItems="center" spacing={2} sx={{ mb: { xs: 6, sm: 8, md: 10 } }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' },
                fontWeight: 700,
                textAlign: 'center',
                color: 'text.primary',
                maxWidth: 700,
              }}
            >
              Filtre e selecione os criadores de conteúdo ideais para sua marca
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                color: 'text.secondary',
                textAlign: 'center',
                maxWidth: 580,
                lineHeight: 1.7,
              }}
            >
              Você no controle! Crie filtros e escolha os creators que mais combinam com a sua marca.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1,
                mt: 2,
                maxWidth: 640,
              }}
            >
              {[
                'Nano Influencers',
                'Micro Influencers',
                'Macro Influencers',
                'UGC Creators',
                'Nichos',
                'Estados',
                'Cidades',
                'Idades',
                'Gênero',
                'Redes Sociais',
                'Estilos',
                'Idiomas',
              ].map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  variant="outlined"
                  sx={{
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    color: 'text.primary',
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    height: { xs: 32, sm: 36 },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: 'primary.main',
                    },
                  }}
                />
              ))}
            </Box>
          </Stack>

          {/* Como funciona — Workflow */}
          <Stack alignItems="center" spacing={1.5} sx={{ mb: { xs: 4, sm: 5 } }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' },
                fontWeight: 700,
                textAlign: 'center',
                color: 'text.primary',
              }}
            >
              Como funciona?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                color: 'text.secondary',
                textAlign: 'center',
                maxWidth: 560,
                lineHeight: 1.7,
              }}
            >
              Da criação da campanha ao resultado final — tudo dentro da Dome.
            </Typography>
          </Stack>

          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 6, sm: 8, md: 10 } }}>
            {[
              {
                step: '01',
                icon: <EditNoteIcon sx={{ fontSize: 28 }} />,
                color: '#2563eb',
                title: 'Crie sua campanha',
                description:
                  'Defina o objetivo, o briefing e o perfil de creator ideal. Publique em minutos.',
              },
              {
                step: '02',
                icon: <SearchIcon sx={{ fontSize: 28 }} />,
                color: '#ec4899',
                title: 'Descubra creators',
                description:
                  'Use filtros inteligentes para encontrar criadores por nicho, localização, engajamento e estilo de conteúdo.',
              },
              {
                step: '03',
                icon: <HowToRegIcon sx={{ fontSize: 28 }} />,
                color: '#8b5cf6',
                title: 'Selecione e aprove',
                description:
                  'Os creators se candidatam à sua campanha. Você avalia o portfólio e escolhe os melhores.',
              },
              {
                step: '04',
                icon: <BarChartIcon sx={{ fontSize: 28 }} />,
                color: '#10b981',
                title: 'Acompanhe resultados',
                description:
                  'Monitore entregas, engajamento e performance em tempo real. Dados reais, não métricas de vaidade.',
              },
            ].map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.step}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 3.5 },
                    borderRadius: 4,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(16px)',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: alpha(item.color, 0.3),
                      boxShadow: `0 8px 32px ${alpha(item.color, 0.12)}`,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 16,
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: alpha(item.color, 0.08),
                      lineHeight: 1,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                      bgcolor: alpha(item.color, 0.1),
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.05rem' } }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.75, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
                  >
                    {item.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* O que entregamos */}
          <Stack alignItems="center" spacing={1.5} sx={{ mb: { xs: 4, sm: 5 } }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' },
                fontWeight: 700,
                textAlign: 'center',
                color: 'text.primary',
              }}
            >
              O que entregamos?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                color: 'text.secondary',
                textAlign: 'center',
                maxWidth: 520,
              }}
            >
              Entenda o que você vai encontrar na plataforma.
            </Typography>
          </Stack>

          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 6, sm: 8, md: 10 } }}>
            {[
              {
                icon: <TuneIcon sx={{ fontSize: 28 }} />,
                color: '#2563eb',
                title: 'Mapeamento',
                description:
                  'Em uma base de +20 mil talentos, encontre o creator perfeito para sua demanda, com todas as características que você precisa.',
              },
              {
                icon: <CampaignIcon sx={{ fontSize: 28 }} />,
                color: '#ec4899',
                title: 'Campanhas na Dome',
                description:
                  'Crie campanhas diretamente na plataforma. Os creators se candidatam e você escolhe os melhores para representar sua marca.',
              },
              {
                icon: <StarIcon sx={{ fontSize: 28 }} />,
                color: '#f59e0b',
                title: 'Conteúdo de Qualidade',
                description:
                  'Nossos creators são formados em criação de conteúdo — gravação, edição e roteiro. Você sabe exatamente o que vai receber.',
              },
              {
                icon: <HandshakeIcon sx={{ fontSize: 28 }} />,
                color: '#10b981',
                title: 'Conteúdo Autêntico',
                description:
                  'Sem roteiros ensaiados. Conteúdo genuíno, com histórias reais e opiniões sinceras que geram identificação com o seu público.',
              },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 3.5 },
                    borderRadius: 4,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(16px)',
                    height: '100%',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: alpha(item.color, 0.3),
                      boxShadow: `0 8px 32px ${alpha(item.color, 0.12)}`,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                      bgcolor: alpha(item.color, 0.1),
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.05rem' } }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.75, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
                  >
                    {item.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* CTA Final */}
          <Stack alignItems="center">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 5, md: 6 },
                borderRadius: 4,
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.15),
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha('#ec4899', 0.05)})`,
                backdropFilter: 'blur(16px)',
                maxWidth: 760,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
                  color: 'text.primary',
                }}
              >
                Descubra criadores de conteúdo excepcionais para a sua empresa
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 3.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.7,
                  maxWidth: 560,
                  mx: 'auto',
                }}
              >
                Coloque suas campanhas dentro da Dome e conecte-se com creators que vão dar voz à sua marca de forma autêntica e estratégica.
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                component="a"
                href="https://wa.me/5511964056099?text=Ol%C3%A1%2C%20sou%20uma%20marca%20e%20quero%20criar%20uma%20campanha%20com%20ajuda%20de%20um%20especialista"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  px: { xs: 4, sm: 5 },
                  py: { xs: 1.2, sm: 1.5 },
                  borderRadius: 3,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  boxShadow: `0 4px 20px ${alpha('#2563eb', 0.35)}`,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                    boxShadow: `0 6px 28px ${alpha('#2563eb', 0.45)}`,
                  },
                }}
              >
                Agendar apresentação
              </Button>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

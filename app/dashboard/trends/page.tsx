'use client';

import React, { useEffect, useRef, useState } from 'react';

// MUI imports
import {
  AppBar,
  Toolbar,
  Avatar,
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  OpenInNew as OpenInNewIcon,
  FilterList as FilterListIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';

interface TrendItem {
  id: string;
  query: string;
  position: number;
  value: string;
  extractedValue: number;
  link: string;
  type: 'top' | 'rising';
  topicType?: string;
  searchVolume?: number;
}

interface TrendsResponse {
  region: string;
  regionLabel: string;
  timeRange: string;
  trends: TrendItem[];
}

const categoryPt: Record<string, string> = {
  all: 'Geral',
  other: 'Outros',
  entertainment: 'Entretenimento',
  sports: 'Esportes',
  technology: 'Tecnologia',
  business_and_finance: 'Negócios e finanças',
  politics: 'Política',
  health: 'Saúde',
  science: 'Ciência',
  games: 'Games',
  shopping: 'Compras',
  travel_and_transportation: 'Viagens e transporte',
  beauty_and_fashion: 'Beleza e moda',
  food_and_drink: 'Comida e bebida',
  autos_and_vehicles: 'Carros e veículos',
  hobbies_and_leisure: 'Hobbies e lazer',
  jobs_and_education: 'Empregos e educação',
  law_and_government: 'Lei e governo',
  pets_and_animals: 'Animais',
  climate: 'Clima',
};

const translateCategory = (cat: string) =>
  categoryPt[cat] ??
  (cat
    ? cat
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
    : cat);

const capitalize = (s: string) =>
  s.length
    ? s
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
    : s;

const formatVolume = (num: number | undefined): string => {
  if (num == null || Number.isNaN(num)) return '—';
  if (num >= 1_000_000) {
    const mi = num / 1_000_000;
    return `${mi % 1 === 0 ? mi : mi.toFixed(1).replace('.', ',')} mi`;
  }
  if (num >= 1_000) {
    const mil = num / 1_000;
    return `${mil % 1 === 0 ? mil : mil.toFixed(1).replace('.', ',')} mil`;
  }
  return num.toString();
};

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'top' | 'rising'>('rising');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categoryAnchorEl, setCategoryAnchorEl] = useState<null | HTMLElement>(null);

  const TRENDS_REFRESH_MS = 3 * 60 * 60 * 1000; // 3 horas

  async function loadTrends(silent = false) {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch('/api/trends');
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Erro ao carregar trends');
        setData(null);
        return;
      }

      setData(json);
      setError(null);
    } catch {
      setError('Falha ao conectar. Tente novamente.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    loadTrends(false);

    const interval = setInterval(() => {
      if (cancelled) return;
      loadTrends(true); // refresh em background sem mostrar loading
    }, TRENDS_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const trends = data?.trends ?? [];

  const categoriesInData = React.useMemo(() => {
    const set = new Set<string>();
    trends.forEach((t) => {
      if (t.topicType) set.add(t.topicType);
    });
    return Array.from(set).sort((a, b) =>
      (categoryPt[a] ?? a).localeCompare(categoryPt[b] ?? b)
    );
  }, [trends]);

  const filteredByType = trends.filter((t) => t.type === filter);
  const filtered =
    categoryFilter === 'all'
      ? filteredByType
      : filteredByType.filter((t) => t.topicType === categoryFilter);

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: 'top' | 'rising' | null
  ) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  const handleCategoryClick = (event: React.MouseEvent<HTMLElement>) => {
    setCategoryAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setCategoryAnchorEl(null);
  };

  const handleCategorySelect = (category: string) => {
    setCategoryFilter(category);
    handleCategoryClose();
  };

  return (
    <Box
      sx={{
        maxWidth: 672,
        mx: 'auto',
        pb: { xs: 12, sm: 4 },
        bgcolor: 'background.paper',
        minHeight: '100vh',
      }}
    >
      {/* AppBar Fixo */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: 'calc(100% - 256px)' },
        }}
      >
        <Box sx={{ maxWidth: 672, mx: 'auto', width: '100%' }}>
          <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
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
                <TrendingUpIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Top Trends
              </Typography>
            </Stack>
          </Toolbar>
        </Box>
      </AppBar>

      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

      {/* Descrição */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Pesquisas em alta no Google no Brasil. Use para se inspirar e criar conteúdo em alta.
        </Typography>
        {data?.regionLabel && (
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
            Região: {data.regionLabel} · Últimas 24 horas
          </Typography>
        )}
      </Box>

      {/* Filters */}
      {!loading && !error && trends.length > 0 && (
        <Box
          sx={{
            px: 2,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: 5,
                px: 2,
                py: 0.75,
                fontSize: '0.8125rem',
                fontWeight: 500,
                textTransform: 'none',
                border: 'none',
                '&.Mui-selected': {
                  bgcolor: 'text.primary',
                  color: 'background.paper',
                  '&:hover': {
                    bgcolor: 'text.primary',
                  },
                },
                '&:not(.Mui-selected)': {
                  bgcolor: 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                },
              },
            }}
          >
            <ToggleButton value="rising">Em alta</ToggleButton>
            <ToggleButton value="top">Populares</ToggleButton>
          </ToggleButtonGroup>

          <Button
            size="small"
            onClick={handleCategoryClick}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {categoryFilter === 'all' ? 'Categoria' : translateCategory(categoryFilter)}
          </Button>
          <Menu
            anchorEl={categoryAnchorEl}
            open={Boolean(categoryAnchorEl)}
            onClose={handleCategoryClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                maxHeight: '70vh',
                minWidth: 180,
              },
            }}
          >
            <MenuItem
              selected={categoryFilter === 'all'}
              onClick={() => handleCategorySelect('all')}
            >
              Todas
            </MenuItem>
            <Divider />
            {categoriesInData.map((key) => (
              <MenuItem
                key={key}
                selected={categoryFilter === key}
                onClick={() => handleCategorySelect(key)}
              >
                {translateCategory(key)}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ px: 2, py: 2 }}>
        {/* Loading */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
            }}
          >
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography color="text.secondary">Carregando trends do Brasil...</Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert
            severity="warning"
            sx={{
              borderRadius: 3,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <AlertTitle>Não foi possível carregar os trends</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure <code>SEARCHAPI_API_KEY</code> em <code>.env.local</code> usando uma chave do{' '}
              <Typography
                component="a"
                href="https://www.searchapi.io/docs/google-trends"
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                sx={{ textDecoration: 'underline' }}
              >
                SearchAPI (Google Trends)
              </Typography>
              .
            </Typography>
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Nenhum trend encontrado para o filtro selecionado.
            </Typography>
          </Box>
        )}

        {/* Trends list */}
        {!loading && !error && filtered.length > 0 && (
          <Stack spacing={0}>
            {filtered.map((trend, index) => (
              <Box key={trend.id}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ py: 1.5 }}
                >
                  {/* Position number */}
                  <Box
                    sx={{
                      width: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="text.disabled"
                    >
                      {index + 1}
                    </Typography>
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      component="a"
                      href={trend.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{
                        display: '-webkit-box',
                        mb: 0.25,
                        textDecoration: 'none',
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {capitalize(trend.query)}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{
                          color:
                            trend.type === 'rising' ? 'success.main' : 'text.secondary',
                          fontWeight: 500,
                        }}
                      >
                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2" fontWeight={500}>
                          {trend.type === 'rising'
                            ? trend.value === 'Breakout'
                              ? 'Alta'
                              : trend.value
                            : formatVolume(
                              trend.searchVolume ??
                              (trend.type === 'top' ? trend.extractedValue : undefined)
                            )}
                          {trend.type === 'rising' &&
                            trend.searchVolume != null &&
                            trend.searchVolume > 0 && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ opacity: 0.9 }}
                              >
                                {' · +'}
                                {formatVolume(trend.searchVolume)}
                              </Typography>
                            )}
                        </Typography>
                      </Stack>
                      {trend.topicType && (
                        <Typography variant="body2" color="text.disabled">
                          {translateCategory(trend.topicType)}
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  {/* Link button */}
                  <IconButton
                    component="a"
                    href={trend.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    title="Pesquisar no Google"
                    sx={{
                      bgcolor: 'action.hover',
                      flexShrink: 0,
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {index < filtered.length - 1 && <Divider />}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from '@/contexts/AccountContext';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Avatar,
  alpha,
  useTheme,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  AttachMoney as MoneyIcon,
  ShoppingBag as ProductIcon,
  Link as AffiliateIcon,
  Instagram as InstagramIcon,
  MusicNote as TikTokIcon,
  YouTube as YouTubeIcon,
  CheckCircle as AppliedIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';
import CampaignDetailDialog from '@/components/vitrine/CampaignDetailDialog';

interface Campaign {
  _id: string;
  brand_name: string;
  brand_logo?: string;
  brand_instagram?: string;
  brand_website?: string;
  title: string;
  description: string;
  briefing: string;
  content_type: string;
  content_usage: string;
  category?: string;
  niches: string[];
  slots: number;
  slots_filled: number;
  budget_per_creator?: number;
  includes_product: boolean;
  product_description?: string;
  deliverables: string[];
  application_deadline?: string;
  content_deadline?: string;
  start_date?: string;
  applications_count: number;
  images?: string[];
  filters?: {
    gender?: string;
    min_age?: number;
    max_age?: number;
    min_followers?: number;
    max_followers?: number;
    countries?: string[];
  };
}

// Tipo de compensação derivado dos campos da campanha
type CompensationType = 'paid' | 'product' | 'affiliate' | 'free';

function getCompensationType(campaign: Campaign): CompensationType {
  if (campaign.budget_per_creator && campaign.budget_per_creator > 0) return 'paid';
  if (campaign.includes_product) return 'product';
  if (campaign.content_usage === 'anuncios' || campaign.content_usage === 'ambos') return 'affiliate';
  return 'free';
}

function normalizeCountry(s: string | undefined): string {
  return (s || '').trim().toLowerCase().normalize('NFD').replace(/\u0300/g, '');
}

function getCreatorAge(birthDateIso: string | undefined): number | null {
  if (!birthDateIso) return null;
  const birth = new Date(birthDateIso);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export type IneligibleReasons = string[];

export function getCampaignEligibility(
  campaign: Campaign,
  creator: { address_country?: string | null; birth_date?: string | null; followers_at_signup?: number | null }
): { eligible: boolean; reasons: IneligibleReasons } {
  const reasons: string[] = [];

  const countries = campaign.filters?.countries;
  if (countries && countries.length > 0) {
    const creatorCountry = normalizeCountry(creator.address_country);
    if (!creatorCountry) {
      reasons.push('Campanha disponível apenas para: ' + countries.join(', '));
    } else {
      const match = countries.some((c) => normalizeCountry(c) === creatorCountry);
      if (!match) reasons.push('Campanha disponível apenas para: ' + countries.join(', '));
    }
  }

  const minAge = campaign.filters?.min_age;
  const maxAge = campaign.filters?.max_age;
  if (minAge != null || maxAge != null) {
    const age = getCreatorAge(creator.birth_date ?? undefined);
    if (age === null) {
      reasons.push('Idade fora do perfil da campanha (informe sua data de nascimento no portfólio).');
    } else {
      if (minAge != null && age < minAge) reasons.push(`Idade mínima da campanha: ${minAge} anos.`);
      if (maxAge != null && age > maxAge) reasons.push(`Idade máxima da campanha: ${maxAge} anos.`);
    }
  }

  const minFollowers = campaign.filters?.min_followers;
  const maxFollowers = campaign.filters?.max_followers;
  if (minFollowers != null || maxFollowers != null) {
    const followers = creator.followers_at_signup ?? 0;
    if (minFollowers != null && followers < minFollowers) {
      reasons.push(`Mínimo de seguidores: ${minFollowers.toLocaleString('pt-BR')}.`);
    }
    if (maxFollowers != null && followers > maxFollowers) {
      reasons.push(`Máximo de seguidores: ${maxFollowers.toLocaleString('pt-BR')}.`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

const COMPENSATION_CONFIG: Record<CompensationType, {
  icon: React.ReactNode;
  label: string;
  gradient: string;
}> = {
  paid: {
    icon: <MoneyIcon sx={{ fontSize: 22, color: 'white' }} />,
    label: 'Pagamento em dinheiro',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  },
  product: {
    icon: <ProductIcon sx={{ fontSize: 20, color: 'white' }} />,
    label: 'Pagamento em produto',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
  },
  affiliate: {
    icon: <AffiliateIcon sx={{ fontSize: 20, color: 'white' }} />,
    label: 'Afiliação / comissão',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
  },
  free: {
    icon: <MoneyIcon sx={{ fontSize: 20, color: 'white' }} />,
    label: 'Permuta / UGC',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ugc: 'UGC',
  reels: 'Reels',
  stories: 'Stories',
  tiktok: 'TikTok',
  post_feed: 'Post Feed',
  outro: 'Outro',
};

// Retorna quantos dias faltam para o deadline
function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

function formatBudget(cents?: number): string | null {
  if (!cents) return null;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Botão de rede social estilizado como na referência
function SocialButton({ type, handle }: { type: 'instagram' | 'tiktok' | 'youtube'; handle: string }) {
  const configs = {
    instagram: {
      label: 'Instagram',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #7c3aed 100%)',
      icon: <InstagramIcon sx={{ fontSize: 18 }} />,
      href: `https://instagram.com/${handle.replace('@', '')}`,
    },
    tiktok: {
      label: 'TikTok',
      gradient: 'linear-gradient(135deg, #0f0f0f 0%, #ee1d52 100%)',
      icon: <TikTokIcon sx={{ fontSize: 18 }} />,
      href: `https://tiktok.com/@${handle.replace('@', '')}`,
    },
    youtube: {
      label: 'YouTube',
      gradient: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
      icon: <YouTubeIcon sx={{ fontSize: 18 }} />,
      href: handle,
    },
  };
  const cfg = configs[type];
  return (
    <Button
      href={cfg.href}
      target="_blank"
      rel="noopener noreferrer"
      startIcon={cfg.icon}
      size="small"
      sx={{
        background: cfg.gradient,
        color: 'white',
        textTransform: 'none',
        fontWeight: 700,
        borderRadius: 6,
        fontSize: '0.78rem',
        px: 1.5,
        py: 0.5,
        minWidth: 0,
        '&:hover': { opacity: 0.9, background: cfg.gradient },
      }}
    >
      {cfg.label}
    </Button>
  );
}

// Card individual de campanha
function CampaignCard({
  campaign,
  hasApplied,
  isMidiaKitComplete,
  onApply,
  ineligibleReasons,
}: {
  campaign: Campaign;
  hasApplied: boolean;
  isMidiaKitComplete: boolean;
  onApply: (c: Campaign) => void;
  ineligibleReasons: IneligibleReasons;
}) {
  const isIneligible = ineligibleReasons.length > 0;
  const theme = useTheme();
  const compensation = getCompensationType(campaign);
  const compCfg = COMPENSATION_CONFIG[compensation];
  const slotsLeft = campaign.slots - campaign.slots_filled;
  const isFull = slotsLeft <= 0;
  const days = daysUntil(campaign.application_deadline);
  const budget = formatBudget(campaign.budget_per_creator);

  // Detectar rede social principal
  const socialType: 'instagram' | 'tiktok' | null =
    campaign.content_type === 'tiktok'
      ? 'tiktok'
      : campaign.brand_instagram
      ? 'instagram'
      : null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Ribbon de compensação — triângulo no canto superior direito */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 64,
          height: 64,
          overflow: 'hidden',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <Tooltip title={compCfg.label} placement="left">
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 64px 64px 0',
              borderColor: 'transparent',
              // Hack: use a square rotated element on top to create the filled triangle
              '&::after': {
                content: '""',
                display: 'none',
              },
            }}
          />
          {/* Filled triangle using clip-path */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 64,
              height: 64,
              background: compCfg.gradient,
              clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              pt: 0.75,
              pr: 0.75,
              pointerEvents: 'auto',
            }}
          >
            {compCfg.icon}
          </Box>
        </Tooltip>
      </Box>

      {/* Card content */}
      <Box sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isIneligible && (
          <Alert
            severity="warning"
            sx={{
              mb: 1.5,
              py: 0.5,
              px: 1,
              '& .MuiAlert-message': { fontSize: '0.75rem' },
            }}
          >
            {ineligibleReasons.length === 1
              ? ineligibleReasons[0]
              : 'Você não atende aos requisitos: ' + ineligibleReasons.join(' ')}
          </Alert>
        )}
        {/* Brand row */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, pr: 5 }}>
          <Avatar
            src={campaign.brand_logo}
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {campaign.brand_name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, fontSize: { xs: '0.82rem', sm: '0.875rem' }, lineHeight: 1.2 }}
            >
              {campaign.brand_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              {CONTENT_TYPE_LABELS[campaign.content_type] || campaign.content_type}
            </Typography>
          </Box>
        </Stack>

        {/* Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {campaign.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {campaign.description}
        </Typography>

        {/* Niches */}
        {campaign.niches.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
            {campaign.niches.slice(0, 3).map((n) => (
              <Chip
                key={n}
                label={n}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.63rem', height: 18, borderRadius: 1 }}
              />
            ))}
            {campaign.niches.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', fontSize: '0.65rem' }}>
                +{campaign.niches.length - 3}
              </Typography>
            )}
          </Stack>
        )}

        {/* Social button */}
        {socialType && campaign.brand_instagram && (
          <Box sx={{ mb: 1.5 }}>
            <SocialButton type={socialType} handle={campaign.brand_instagram} />
          </Box>
        )}

        {/* Budget badge */}
        {budget && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
            <MoneyIcon sx={{ fontSize: 14, color: 'success.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', fontSize: '0.78rem' }}>
              {budget} por creator
            </Typography>
          </Stack>
        )}

        {/* Deadline */}
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
          <ClockIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
            Prazo para candidaturas
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            color: days !== null && days <= 3 ? 'error.main' : 'warning.main',
            mb: 2,
            lineHeight: 1.2,
          }}
        >
          {days === null
            ? 'Aberto'
            : days <= 0
            ? 'Encerrado'
            : days === 1
            ? '1 dia'
            : `${days} dias`}
        </Typography>
      </Box>

      {/* CTA button — full width, bottom */}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: { xs: 2, sm: 2.5 } }}>
        {hasApplied ? (
          <Button
            fullWidth
            variant="outlined"
            color="success"
            startIcon={<AppliedIcon />}
            disabled
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              py: 1,
            }}
          >
            Candidatura enviada
          </Button>
        ) : isIneligible ? (
          <Button
            fullWidth
            variant="outlined"
            disabled
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              py: 1,
              borderColor: 'warning.main',
              color: 'warning.dark',
            }}
          >
            Inelegível
          </Button>
        ) : (
          <Tooltip
            title={
              !isMidiaKitComplete
                ? 'Complete seu portfólio primeiro'
                : isFull
                ? 'Vagas esgotadas'
                : days !== null && days <= 0
                ? 'Prazo encerrado'
                : ''
            }
          >
            <span style={{ display: 'block' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => onApply(campaign)}
                disabled={!isMidiaKitComplete || isFull || (days !== null && days <= 0)}
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  borderRadius: 2,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  py: 1.1,
                  background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
                  },
                  '&.Mui-disabled': {
                    background: alpha('#000', 0.12),
                  },
                }}
              >
                Ver detalhes da campanha
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
}

export default function VitrineCampanhasPage() {
  const theme = useTheme();
  const { account, isMidiaKitComplete } = useAccount();
  const creatorForEligibility = {
    address_country: account?.address_country ?? null,
    birth_date: account?.birth_date ?? null,
    followers_at_signup: account?.followers_at_signup ?? null,
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCompensation, setFilterCompensation] = useState<'all' | 'paid' | 'product' | 'affiliate'>('all');

  // Campaign detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
    fetchMyApplications();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns?limit=50');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyApplications() {
    try {
      const res = await fetch('/api/campaigns/my-applications');
      const data = await res.json();
      const ids = new Set<string>(
        (data.applications || []).map((a: { campaign_id: { _id: string } | string }) =>
          typeof a.campaign_id === 'object' ? a.campaign_id._id : a.campaign_id
        )
      );
      setAppliedIds(ids);
    } catch {
      // ignore
    }
  }

  const allNiches = useMemo(() => {
    const set = new Set<string>();
    for (const c of campaigns) for (const n of c.niches) set.add(n);
    return Array.from(set).sort();
  }, [campaigns]);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        !searchText ||
        c.title.toLowerCase().includes(searchText.toLowerCase()) ||
        c.brand_name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.description.toLowerCase().includes(searchText.toLowerCase());
      const matchNiche = filterNiche === 'all' || c.niches.includes(filterNiche);
      const matchType = filterType === 'all' || c.content_type === filterType;
      const matchCompensation =
        filterCompensation === 'all' || getCompensationType(c) === filterCompensation;
      return matchSearch && matchNiche && matchType && matchCompensation;
    });
  }, [campaigns, searchText, filterNiche, filterType, filterCompensation]);

  function openDetailDialog(campaign: Campaign) {
    setSelectedCampaign(campaign);
    setDetailDialogOpen(true);
  }

  // Legenda dos tipos de compensação
  const legendItems = [
    { ...COMPENSATION_CONFIG.paid, key: 'paid' },
    { ...COMPENSATION_CONFIG.product, key: 'product' },
    { ...COMPENSATION_CONFIG.affiliate, key: 'affiliate' },
  ] as const;

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
      <TrabalhosTabs />

      {!isMidiaKitComplete && (
        <Alert
          severity="warning"
          icon={<BadgeIcon fontSize="small" />}
          action={
            <Button
              component={Link}
              href="/dashboard/trabalhos/portfolio"
              color="inherit"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.72rem', sm: '0.8rem' }, whiteSpace: 'nowrap' }}
            >
              Completar perfil
            </Button>
          }
          sx={{
            mb: { xs: 2, sm: 3 },
            borderRadius: { xs: 2, sm: 2.5 },
            fontSize: { xs: '0.78rem', sm: '0.85rem' },
            alignItems: 'center',
            '& .MuiAlert-message': { flex: 1 },
          }}
        >
          Complete seu Portfólio para poder se candidatar a campanhas.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
            Vitrine de Campanhas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Explore campanhas de marcas e candidate-se.
          </Typography>
        </Box>

        {/* Filtro por tipo de compensação — clicável */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {legendItems.map((item) => {
            const isSelected = filterCompensation === item.key;
            return (
              <Tooltip key={item.key} title={isSelected ? 'Clique para mostrar todas' : item.label}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  onClick={() => setFilterCompensation(isSelected ? 'all' : item.key)}
                  sx={{
                    px: 1.25,
                    py: 0.6,
                    borderRadius: 6,
                    border: 1,
                    borderColor: isSelected ? 'transparent' : 'divider',
                    cursor: 'pointer',
                    bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                    transition: 'background 0.15s, border-color 0.15s',
                    '&:hover': {
                      bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.action.hover, 0.04),
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: item.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: '11px !important', color: 'white' } })}
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: isSelected ? 700 : 500 }}>
                    {item.key === 'paid' ? 'Pago' : item.key === 'product' ? 'Produto' : 'Afiliado'}
                  </Typography>
                </Stack>
              </Tooltip>
            );
          })}
        </Stack>
      </Stack>

      {/* Filtros */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar por título ou marca..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Nicho</InputLabel>
          <Select value={filterNiche} label="Nicho" onChange={(e) => setFilterNiche(e.target.value)}>
            <MenuItem value="all">Todos os nichos</MenuItem>
            {allNiches.map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={filterType} label="Tipo" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="all">Todos os tipos</MenuItem>
            {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: { xs: 3, sm: 4 },
            border: 1,
            borderColor: 'divider',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha('#ec4899', 0.04)})`,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            {campaigns.length === 0 ? 'Campanhas chegando em breve!' : 'Nenhuma campanha encontrada'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', lineHeight: 1.7, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}>
            {campaigns.length === 0
              ? 'Estamos preparando as primeiras campanhas com marcas parceiras. Fique de olho!'
              : 'Tente ajustar os filtros para ver mais campanhas.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 2.5 }}>
          {filtered.map((campaign) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={campaign._id}>
              <CampaignCard
                campaign={campaign}
                hasApplied={appliedIds.has(campaign._id)}
                isMidiaKitComplete={isMidiaKitComplete}
                onApply={openDetailDialog}
                ineligibleReasons={getCampaignEligibility(campaign, creatorForEligibility).reasons}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Campaign detail + apply dialog */}
      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={detailDialogOpen}
        hasApplied={selectedCampaign ? appliedIds.has(selectedCampaign._id) : false}
        onClose={() => setDetailDialogOpen(false)}
        onApplied={(id) => setAppliedIds((prev) => new Set([...prev, id]))}
        ineligibleReasons={selectedCampaign ? getCampaignEligibility(selectedCampaign, creatorForEligibility).reasons : []}
      />
    </Box>
  );
}

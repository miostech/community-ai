'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  Avatar,
  alpha,
  useTheme,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  Instagram as InstagramIcon,
  MusicNote as TikTokIcon,
  YouTube as YouTubeIcon,
  AttachMoney as MoneyIcon,
  ShoppingBag as ProductIcon,
  Link as AffiliateIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  AccessTime as ClockIcon,
  ArrowBack as ArrowBackIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

export interface CampaignDetail {
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
  };
}

type CompensationType = 'paid' | 'product' | 'affiliate' | 'free';

function getCompensationType(campaign: CampaignDetail): CompensationType {
  if (campaign.budget_per_creator && campaign.budget_per_creator > 0) return 'paid';
  if (campaign.includes_product) return 'product';
  if (campaign.content_usage === 'anuncios' || campaign.content_usage === 'ambos') return 'affiliate';
  return 'free';
}

const COMPENSATION_CONFIG: Record<
  CompensationType,
  { icon: React.ReactNode; label: string; gradient: string; chipBg: string; chipColor: string }
> = {
  paid: {
    icon: <MoneyIcon />,
    label: 'Campanha paga',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    chipBg: '#fdf2f8',
    chipColor: '#be185d',
  },
  product: {
    icon: <ProductIcon />,
    label: 'Campanha em produto',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    chipBg: '#f5f3ff',
    chipColor: '#6d28d9',
  },
  affiliate: {
    icon: <AffiliateIcon />,
    label: 'Campanha de afiliação',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    chipBg: '#eff6ff',
    chipColor: '#1d4ed8',
  },
  free: {
    icon: <MoneyIcon />,
    label: 'Campanha UGC',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    chipBg: '#f8fafc',
    chipColor: '#475569',
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

const CONTENT_TYPE_PLATFORMS: Record<string, 'instagram' | 'tiktok' | 'youtube' | null> = {
  ugc: null,
  reels: 'instagram',
  stories: 'instagram',
  tiktok: 'tiktok',
  post_feed: 'instagram',
  outro: null,
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toISOString().split('T')[0];
}

function formatBudget(cents?: number): string | null {
  if (!cents) return null;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildAudienceLabel(campaign: CampaignDetail): string {
  const parts: string[] = [];
  const gender = campaign.filters?.gender;
  if (gender === 'masculino') parts.push('Masculino');
  else if (gender === 'feminino') parts.push('Feminino');
  else parts.push('Feminino e Misto');
  const min = campaign.filters?.min_age;
  const max = campaign.filters?.max_age;
  if (min && max) parts.push(`${min}–${max} anos`);
  else if (min) parts.push(`a partir de ${min} anos`);
  else if (max) parts.push(`até ${max} anos`);
  return parts.join(', ');
}

/* ─── Sub-components ─────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        fontSize: '0.65rem',
        fontWeight: 800,
        letterSpacing: '0.1em',
        color: 'text.disabled',
        display: 'block',
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

function SectionBlock({ title, children, sx = {} }: { title: string; children: React.ReactNode; sx?: object }) {
  return (
    <Box sx={sx}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </Box>
  );
}

function PlatformButton({ platform, handle }: { platform: 'instagram' | 'tiktok' | 'youtube'; handle?: string }) {
  const configs = {
    instagram: {
      label: 'Instagram',
      gradient: 'linear-gradient(90deg, #f97316, #ec4899, #7c3aed)',
      icon: <InstagramIcon sx={{ fontSize: 18 }} />,
      href: handle ? `https://instagram.com/${handle.replace('@', '')}` : '#',
    },
    tiktok: {
      label: 'TikTok',
      gradient: 'linear-gradient(90deg, #010101, #ee1d52)',
      icon: <TikTokIcon sx={{ fontSize: 18 }} />,
      href: handle ? `https://tiktok.com/@${handle.replace('@', '')}` : '#',
    },
    youtube: {
      label: 'YouTube',
      gradient: 'linear-gradient(90deg, #ff0000, #cc0000)',
      icon: <YouTubeIcon sx={{ fontSize: 18 }} />,
      href: handle || '#',
    },
  };
  const cfg = configs[platform];
  return (
    <Button
      href={cfg.href}
      target="_blank"
      rel="noopener noreferrer"
      startIcon={cfg.icon}
      fullWidth
      sx={{
        background: cfg.gradient,
        color: 'white',
        textTransform: 'none',
        fontWeight: 700,
        borderRadius: 2,
        fontSize: '0.88rem',
        py: 1,
        justifyContent: 'flex-start',
        px: 1.5,
        '&:hover': { opacity: 0.88, background: cfg.gradient },
      }}
    >
      {cfg.label}
    </Button>
  );
}

function DateBadge({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 1.5,
        py: 0.75,
        textAlign: 'center',
        minWidth: 88,
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontSize: '0.58rem', display: 'block', mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}

/* ─── Main component ─────────────────────────────────────── */

interface CampaignDetailDialogProps {
  campaign: CampaignDetail | null;
  open: boolean;
  hasApplied: boolean;
  onClose: () => void;
  onApplied: (campaignId: string) => void;
}

export default function CampaignDetailDialog({
  campaign,
  open,
  hasApplied,
  onClose,
  onApplied,
}: CampaignDetailDialogProps) {
  const theme = useTheme();
  const [step, setStep] = useState<'detail' | 'apply'>('detail');
  const [pitch, setPitch] = useState('');
  const [contentProposal, setContentProposal] = useState('');
  const [isCustomer, setIsCustomer] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  function handleClose() {
    if (applying) return;
    onClose();
    setTimeout(() => {
      setStep('detail');
      setPitch('');
      setContentProposal('');
      setIsCustomer(false);
      setApplyError('');
      setApplySuccess('');
    }, 300);
  }

  function openApply() {
    setApplyError('');
    setApplySuccess('');
    setStep('apply');
  }

  async function handleApply() {
    if (!campaign) return;
    if (!pitch.trim()) { setApplyError('O campo pitch é obrigatório.'); return; }
    setApplying(true);
    setApplyError('');
    try {
      const res = await fetch(`/api/campaigns/${campaign._id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch, content_proposal: contentProposal, is_customer: isCustomer }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplySuccess('Candidatura enviada com sucesso!');
        onApplied(campaign._id);
        setTimeout(() => handleClose(), 1800);
      } else {
        setApplyError(data.error || 'Erro ao enviar candidatura.');
      }
    } catch {
      setApplyError('Erro ao conectar com o servidor.');
    } finally {
      setApplying(false);
    }
  }

  if (!campaign) return null;

  const compensation = getCompensationType(campaign);
  const compCfg = COMPENSATION_CONFIG[compensation];
  const budget = formatBudget(campaign.budget_per_creator);
  const slotsLeft = campaign.slots - campaign.slots_filled;
  const isFull = slotsLeft <= 0;
  const platform = CONTENT_TYPE_PLATFORMS[campaign.content_type];
  const audienceLabel = buildAudienceLabel(campaign);

  /* Date badges — only show dates that exist */
  const dates = [
    campaign.start_date && { label: 'Início', value: formatDate(campaign.start_date) },
    campaign.application_deadline && { label: 'Candidaturas', value: formatDate(campaign.application_deadline) },
    campaign.content_deadline && { label: 'Entrega', value: formatDate(campaign.content_deadline) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)',
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          maxHeight: { xs: '100dvh', sm: '90vh' },
          m: { xs: 0, sm: 2 },
          height: { xs: '100dvh', sm: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.6)'
              : '0 8px 40px rgba(0,0,0,0.14)',
        },
      }}
    >
      {/* ── Sticky Header ───────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        {/* Breadcrumb row */}
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography
            variant="caption"
            onClick={handleClose}
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.75rem',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Vitrine de Campanhas
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mx: 0.75, fontSize: '0.75rem' }}>
            /
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.75rem', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {campaign.title}
          </Typography>
          <IconButton size="small" onClick={handleClose} sx={{ ml: 1, flexShrink: 0 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>

        {/* Brand + title + dates */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={campaign.brand_logo}
              variant="rounded"
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontSize: 17,
                fontWeight: 800,
                borderRadius: 2,
              }}
            >
              {campaign.brand_name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {campaign.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                {campaign.brand_name}
              </Typography>
            </Box>
          </Stack>

          {dates.length > 0 && (
            <Stack direction="row" spacing={1} flexShrink={0} flexWrap="wrap" sx={{ gap: 1 }}>
              {dates.map((d) => (
                <DateBadge key={d.label} label={d.label} value={d.value} />
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ── Scrollable Body ─────────────────────────────────── */}
      <DialogContent sx={{ p: 0, overflow: 'auto', flex: 1 }}>
        {step === 'detail' ? (
          <Grid container sx={{ minHeight: '100%' }}>

            {/* ── Left column ─ main content ────────────────── */}
            <Grid
              size={{ xs: 12, sm: 7 }}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRight: { sm: '1px solid' },
                borderColor: { sm: 'divider' },
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              {/* Campaign type badge */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 6,
                    bgcolor: compCfg.chipBg,
                    border: '1px solid',
                    borderColor: alpha(compCfg.chipColor, 0.25),
                  }}
                >
                  {React.cloneElement(compCfg.icon as React.ReactElement, {
                    sx: { fontSize: 13, color: compCfg.chipColor },
                  })}
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', color: compCfg.chipColor }}>
                    {compCfg.label}
                  </Typography>
                </Box>

                {/* Slots pill */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 6,
                    bgcolor: isFull ? alpha('#ef4444', 0.08) : alpha('#10b981', 0.08),
                    border: '1px solid',
                    borderColor: isFull ? alpha('#ef4444', 0.2) : alpha('#10b981', 0.2),
                  }}
                >
                  <ClockIcon sx={{ fontSize: 11, color: isFull ? 'error.main' : 'success.main' }} />
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isFull ? 'error.main' : 'success.main',
                    }}
                  >
                    {isFull ? 'Vagas esgotadas' : `${slotsLeft} vaga${slotsLeft !== 1 ? 's' : ''}`}
                  </Typography>
                </Box>
              </Stack>

              {/* Payment notice */}
              {(campaign.includes_product || budget) && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    p: 1.5,
                    mb: 2.5,
                    borderRadius: 2,
                    bgcolor: budget ? alpha('#10b981', 0.06) : alpha('#6366f1', 0.06),
                    border: '1px solid',
                    borderColor: budget ? alpha('#10b981', 0.2) : alpha('#6366f1', 0.2),
                  }}
                >
                  {budget ? (
                    <MoneyIcon sx={{ fontSize: 16, color: 'success.main', mt: 0.1, flexShrink: 0 }} />
                  ) : (
                    <ProductIcon sx={{ fontSize: 16, color: '#6366f1', mt: 0.1, flexShrink: 0 }} />
                  )}
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'text.secondary' }}>
                    {budget
                  ? `Remuneração de ${budget} por creator`
                  : 'O pagamento desta campanha é exclusivamente em produto.'}
                  </Typography>
                </Box>
              )}

              {/* Description */}
              <SectionBlock title="Descrição" sx={{ mb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.83rem', lineHeight: 1.75, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {campaign.description}
                </Typography>
              </SectionBlock>

              {/* Product description */}
              {campaign.product_description && (
                <SectionBlock title="Descrição do produto" sx={{ mb: 2.5 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.83rem', lineHeight: 1.75, whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {campaign.product_description}
                  </Typography>
                </SectionBlock>
              )}

              {/* Briefing */}
              <SectionBlock title="Briefing" sx={{ mb: 2.5 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.83rem', lineHeight: 1.75, whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {campaign.briefing}
                </Typography>
              </SectionBlock>

              {/* Deliverables */}
              {campaign.deliverables.length > 0 && (
                <SectionBlock title="Entregas esperadas" sx={{ mb: 1 }}>
                  <Stack spacing={0.75}>
                    {campaign.deliverables.map((d, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                        <CheckIcon sx={{ fontSize: 14, color: 'success.main', mt: 0.3, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.83rem', lineHeight: 1.6 }}>
                          {d}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </SectionBlock>
              )}
            </Grid>

            {/* ── Right column ─ metadata ────────────────────── */}
            <Grid
              size={{ xs: 12, sm: 5 }}
              sx={{
                p: { xs: 2.5, sm: 3 },
                bgcolor: { sm: alpha(theme.palette.background.default, 0.5) },
                borderTop: { xs: '1px solid', sm: 'none' },
                borderColor: { xs: 'divider', sm: 'transparent' },
              }}
            >
              {/* Audience */}
              <SectionBlock title="Público-alvo" sx={{ mb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mb: 1 }}>
                  {audienceLabel}
                </Typography>
                {campaign.niches.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {campaign.niches.map((n) => (
                      <Chip
                        key={n}
                        label={n}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 22, borderRadius: 1.5 }}
                      />
                    ))}
                  </Stack>
                )}
              </SectionBlock>

              <Divider sx={{ mb: 2.5 }} />

              {/* Content Requirements */}
              <SectionBlock title="Requisitos de conteúdo" sx={{ mb: 2.5 }}>
                {platform ? (
                  <PlatformButton platform={platform} handle={campaign.brand_instagram} />
                ) : (
                  <Chip
                    label={CONTENT_TYPE_LABELS[campaign.content_type] || campaign.content_type}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.78rem' }}
                  />
                )}
                {campaign.deliverables.length > 0 && (
                  <Stack spacing={0.5} sx={{ mt: 1.25 }}>
                    {campaign.deliverables.map((d, i) => (
                      <Typography key={i} variant="caption" color="text.secondary" sx={{ fontSize: '0.73rem', lineHeight: 1.6 }}>
                        · {d}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </SectionBlock>

              {/* Hashtags */}
              {campaign.niches.length > 0 && (
                <>
                  <Divider sx={{ mb: 2.5 }} />
                  <SectionBlock title="Hashtags sugeridas" sx={{ mb: 2.5 }}>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {campaign.niches.map((n) => (
                        <Chip
                          key={n}
                          label={`#${n.replace(/\s+/g, '')}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 22, borderRadius: 1.5 }}
                        />
                      ))}
                    </Stack>
                  </SectionBlock>
                </>
              )}

              {/* Mentions */}
              {campaign.brand_instagram && (
                <>
                  <Divider sx={{ mb: 2.5 }} />
                  <SectionBlock title="Mencionar" sx={{ mb: 2.5 }}>
                    <Chip
                      label={
                        campaign.brand_instagram.startsWith('@')
                          ? campaign.brand_instagram
                          : `@${campaign.brand_instagram}`
                      }
                      size="small"
                      component="a"
                      href={`https://instagram.com/${campaign.brand_instagram.replace('@', '')}`}
                      target="_blank"
                      clickable
                      sx={{ fontSize: '0.75rem', height: 24, borderRadius: 1.5 }}
                    />
                  </SectionBlock>
                </>
              )}

              {/* Visual References */}
              {campaign.images && campaign.images.length > 0 && (
                <>
                  <Divider sx={{ mb: 2.5 }} />
                  <SectionBlock title="Fotos de referência" sx={{ mb: 2.5 }}>
                    <Grid container spacing={0.75}>
                      {campaign.images.map((img, i) => (
                        <Grid key={i} size={{ xs: 4 }}>
                          <Box
                            component="img"
                            src={img}
                            alt={`Reference ${i + 1}`}
                            sx={{
                              width: '100%',
                              aspectRatio: '1',
                              objectFit: 'cover',
                              borderRadius: 1.5,
                              display: 'block',
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </SectionBlock>
                </>
              )}

              {/* Annexed Files / Website */}
              {campaign.brand_website && (
                <>
                  <Divider sx={{ mb: 2.5 }} />
                  <SectionBlock title="Arquivos anexos">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <OpenInNewIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                      <Typography
                        component="a"
                        href={campaign.brand_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontSize: '0.78rem',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {campaign.brand_website}
                      </Typography>
                    </Stack>
                  </SectionBlock>
                </>
              )}
            </Grid>
          </Grid>
        ) : (
          /* ── Apply step ───────────────────────────────────── */
          <Box sx={{ p: { xs: 2.5, sm: 3 }, maxWidth: 540, mx: 'auto' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              size="small"
              onClick={() => setStep('detail')}
              sx={{ textTransform: 'none', fontWeight: 600, mb: 2.5, px: 0 }}
            >
              Ver detalhes da campanha
            </Button>

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, fontSize: '1.05rem' }}>
              Candidatar-se à campanha
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.85rem', lineHeight: 1.65 }}>
              Conta para a marca por que você é a escolha ideal para esta campanha.
            </Typography>

            {applyError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{applyError}</Alert>}
            {applySuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{applySuccess}</Alert>}

            <Stack spacing={2.5}>
              <TextField
                label="Seu pitch *"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                fullWidth
                multiline
                rows={5}
                size="small"
                placeholder="Apresente-se e explique por que você é a creator certa para essa campanha..."
                helperText="Seja específico(a): fale do seu nicho, audiência e conexão com a marca."
              />
              <TextField
                label="Proposta de conteúdo (opcional)"
                value={contentProposal}
                onChange={(e) => setContentProposal(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="Como você criaria o conteúdo? Qual o formato, tom, referências..."
              />
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                onClick={() => setIsCustomer(!isCustomer)}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 0.75,
                    border: '2px solid',
                    borderColor: isCustomer ? 'primary.main' : 'divider',
                    bgcolor: isCustomer ? 'primary.main' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {isCustomer && (
                    <Typography component="span" sx={{ color: 'white', fontSize: '0.7rem', lineHeight: 1, fontWeight: 800 }}>
                      ✓
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  Já sou cliente / já usei o produto desta marca
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}
      </DialogContent>

      {/* ── Footer ──────────────────────────────────────────── */}
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        {step === 'detail' ? (
          <>
            <Button
              onClick={handleClose}
              size="small"
              sx={{ textTransform: 'none', color: 'text.disabled', fontWeight: 500, fontSize: '0.8rem' }}
            >
              Não tenho interesse
            </Button>
            <Box sx={{ flex: 1 }} />
            {hasApplied ? (
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckIcon />}
                disabled
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5 }}
              >
                Candidatura enviada
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={openApply}
                disabled={isFull}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontSize: '0.88rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 2px 12px rgba(16,185,129,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                  },
                  '&.Mui-disabled': { background: alpha('#000', 0.1), boxShadow: 'none' },
                }}
              >
                Candidatar-me a esta campanha
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={() => setStep('detail')}
              disabled={applying}
              size="small"
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 500 }}
            >
              Voltar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleApply}
              variant="contained"
              disabled={applying || !!applySuccess}
              startIcon={applying ? <CircularProgress size={15} color="inherit" /> : <SendIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 1,
                fontSize: '0.88rem',
                background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
                boxShadow: '0 2px 12px rgba(147,51,234,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 16px rgba(147,51,234,0.4)',
                },
              }}
            >
              Enviar candidatura
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

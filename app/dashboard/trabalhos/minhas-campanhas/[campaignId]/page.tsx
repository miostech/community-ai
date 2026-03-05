'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  alpha,
  useTheme,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  AttachMoney as MoneyIcon,
  ShoppingBag as ProductIcon,
  Link as AffiliateIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

interface Campaign {
  _id: string;
  title: string;
  brand_name: string;
  brand_logo?: string;
  description: string;
  briefing: string;
  content_type: string;
  content_usage: string;
  deliverables: string[];
  content_deadline?: string;
  application_deadline?: string;
  start_date?: string;
  budget_per_creator?: number;
  includes_product?: boolean;
  product_description?: string;
  niches: string[];
}

interface Application {
  _id: string;
  status: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ugc: 'UGC',
  reels: 'Reels',
  stories: 'Stories',
  tiktok: 'TikTok',
  post_feed: 'Post Feed',
  outro: 'Outro',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatBudget(cents?: number): string | null {
  if (!cents) return null;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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

export default function MinhaCampanhaDetailPage() {
  const theme = useTheme();
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [campRes, appRes] = await Promise.all([
          fetch(`/api/campaigns/${campaignId}`),
          fetch(`/api/campaigns/${campaignId}/applications?view=mine`),
        ]);
        const campData = await campRes.json();
        const appData = await appRes.json();

        if (!campRes.ok) {
          setError(campData.error || 'Campanha não encontrada.');
          setCampaign(null);
          setApplication(null);
          return;
        }
        setCampaign(campData.campaign);

        const app = appData.application;
        if (!app || (app.status !== 'approved' && app.status !== 'completed')) {
          setError('Você não está aprovado nesta campanha ou ainda não se candidatou.');
          setApplication(null);
          return;
        }
        setApplication(app);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar a campanha.');
        setCampaign(null);
        setApplication(null);
      } finally {
        setLoading(false);
      }
    }
    if (campaignId) fetchData();
  }, [campaignId]);

  const isAffiliate = campaign?.content_usage === 'anuncios' || campaign?.content_usage === 'ambos';
  const budget = campaign ? formatBudget(campaign.budget_per_creator) : null;

  if (loading) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
        <TrabalhosTabs />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !campaign) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
        <TrabalhosTabs />
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Button
            component={Link}
            href="/dashboard/trabalhos/minhas-campanhas"
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Voltar
          </Button>
        </Stack>
        <Alert severity="error">{error || 'Campanha não encontrada.'}</Alert>
      </Box>
    );
  }

  const dates = [
    campaign.start_date && { label: 'Início', value: formatDate(campaign.start_date) },
    campaign.application_deadline && { label: 'Candidaturas até', value: formatDate(campaign.application_deadline) },
    campaign.content_deadline && { label: 'Entrega do conteúdo', value: formatDate(campaign.content_deadline) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
      <TrabalhosTabs />

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Button
          component={Link}
          href="/dashboard/trabalhos/minhas-campanhas"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Minhas Campanhas
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 2, sm: 3 },
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Avatar
              src={campaign.brand_logo}
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {campaign.brand_name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                {campaign.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {campaign.brand_name}
              </Typography>
            </Box>
            <Chip
              label={CONTENT_TYPE_LABELS[campaign.content_type] || campaign.content_type}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          {dates.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              {dates.map((d) => (
                <Box
                  key={d.label}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    {d.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', display: 'block' }}>
                    {d.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {(budget || campaign.includes_product) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: budget ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.primary.main, 0.08),
                border: '1px solid',
                borderColor: budget ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.primary.main, 0.2),
              }}
            >
              {isAffiliate ? (
                <AffiliateIcon sx={{ fontSize: 20, color: 'info.main' }} />
              ) : budget ? (
                <MoneyIcon sx={{ fontSize: 20, color: 'success.main' }} />
              ) : (
                <ProductIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              )}
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {isAffiliate
                  ? 'Campanha de afiliação'
                  : budget
                    ? `Remuneração: ${budget} por creator`
                    : 'Pagamento em produto'}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <SectionLabel>Descrição</SectionLabel>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}
          >
            {campaign.description}
          </Typography>

          {campaign.product_description && (
            <>
              <SectionLabel>Descrição do produto</SectionLabel>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}
              >
                {campaign.product_description}
              </Typography>
            </>
          )}

          <SectionLabel>Briefing</SectionLabel>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.15),
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: '0.9rem', lineHeight: 1.75, whiteSpace: 'pre-line', wordBreak: 'break-word' }}
            >
              {campaign.briefing}
            </Typography>
          </Paper>

          {campaign.deliverables && campaign.deliverables.length > 0 && (
            <>
              <SectionLabel>Entregas esperadas</SectionLabel>
              <Stack spacing={0.75} sx={{ mb: 3 }}>
                {campaign.deliverables.map((d, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mt: 0.25, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {d}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}

          {campaign.niches && campaign.niches.length > 0 && (
            <>
              <SectionLabel>Nichos</SectionLabel>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 3 }}>
                {campaign.niches.map((n) => (
                  <Chip key={n} label={n} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                ))}
              </Stack>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          <Button
            component={Link}
            href={`/dashboard/trabalhos/minhas-campanhas/${campaignId}/submeter`}
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              py: 1.5,
              fontSize: '1rem',
            }}
          >
            Submeter conteúdo
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

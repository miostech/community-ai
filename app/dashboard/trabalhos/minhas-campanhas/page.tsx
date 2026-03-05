'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
  Grid,
  Divider,
} from '@mui/material';
import {
  WorkOutline as WorkIcon,
  Storefront as StorefrontIcon,
  CheckCircle as ApprovedIcon,
  DoneAll as CompletedIcon,
  OpenInNew as OpenIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

interface CampaignPopulated {
  _id: string;
  title: string;
  brand_name: string;
  brand_logo?: string;
  status: string;
  content_type?: string;
  budget_per_creator?: number;
  includes_product?: boolean;
}

interface Application {
  _id: string;
  campaign_id: CampaignPopulated;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ugc: 'UGC',
  reels: 'Reels',
  stories: 'Stories',
  tiktok: 'TikTok',
  post_feed: 'Post Feed',
  outro: 'Outro',
};

function formatBudget(cents?: number): string | null {
  if (!cents) return null;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MinhasCampanhasPage() {
  const theme = useTheme();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyApplications() {
      setLoading(true);
      try {
        const res = await fetch('/api/campaigns/my-applications');
        const data = await res.json();
        const list: Application[] = data.applications || [];
        const approvedOrCompleted = list.filter(
          (a) => a.status === 'approved' || a.status === 'completed'
        );
        setApplications(approvedOrCompleted);
      } catch (err) {
        console.error(err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMyApplications();
  }, []);

  const empty = !loading && applications.length === 0;

  const paymentsToReceive = useMemo(() => {
    const withBudget = applications
      .map((app) => {
        const campaign = app.campaign_id as CampaignPopulated;
        if (!campaign?.budget_per_creator || campaign.budget_per_creator <= 0) return null;
        return {
          campaignId: campaign._id,
          title: campaign.title,
          brand_name: campaign.brand_name,
          amountCents: campaign.budget_per_creator,
          status: app.status,
        };
      })
      .filter(Boolean) as { campaignId: string; title: string; brand_name: string; amountCents: number; status: string }[];
    const totalCents = withBudget.reduce((sum, p) => sum + p.amountCents, 0);
    return { items: withBudget, totalCents };
  }, [applications]);

  const totalToReceiveFormatted = paymentsToReceive.totalCents
    ? (paymentsToReceive.totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
      <TrabalhosTabs />

      <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}
        >
          Minhas Campanhas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Campanhas em que você foi aprovado.
        </Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : empty ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 5 },
            borderRadius: { xs: 3, sm: 4 },
            border: 1,
            borderColor: 'divider',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha('#ec4899', 0.04)})`,
          }}
        >
          <Box
            sx={{
              width: { xs: 48, sm: 64 },
              height: { xs: 48, sm: 64 },
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          >
            <WorkIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.95rem', sm: '1.2rem' } }}
          >
            Nenhuma campanha ainda
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 380, mx: 'auto', lineHeight: 1.7, mb: 2.5, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}
          >
            Quando você for aprovado em uma campanha, ela aparecerá aqui.
          </Typography>
          <Button
            component={Link}
            href="/dashboard/trabalhos/vitrine"
            variant="outlined"
            size="small"
            startIcon={<StorefrontIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
            }}
          >
            Explorar campanhas
          </Button>
        </Paper>
      ) : (
        <>
          {paymentsToReceive.items.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                p: 2,
                mb: 3,
                bgcolor: alpha(theme.palette.success.main, 0.04),
                borderColor: alpha(theme.palette.success.main, 0.25),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <MoneyIcon sx={{ fontSize: 22, color: 'success.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Pagamentos a receber
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.dark', mb: 1.5 }}>
                {totalToReceiveFormatted}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Valor total das campanhas em que você foi aprovado (remuneração em dinheiro).
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={0.75}>
                {paymentsToReceive.items.map((p) => (
                  <Stack
                    key={p.campaignId}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ py: 0.5 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {p.title}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                      {(p.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Suas campanhas
          </Typography>
          <Grid container spacing={2}>
          {applications.map((app) => {
            const campaign = app.campaign_id as CampaignPopulated;
            if (!campaign || typeof campaign !== 'object') return null;
            const budget = formatBudget(campaign.budget_per_creator);
            const contentType = campaign.content_type
              ? CONTENT_TYPE_LABELS[campaign.content_type] || campaign.content_type
              : null;
            const isCompleted = app.status === 'completed';

            return (
              <Grid item xs={12} sm={6} key={app._id}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <Box sx={{ p: 2, flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                      <Avatar
                        src={campaign.brand_logo}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {campaign.brand_name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {campaign.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {campaign.brand_name}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        icon={isCompleted ? <CompletedIcon sx={{ fontSize: '0.9rem !important' }} /> : <ApprovedIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={isCompleted ? 'Concluída' : 'Aprovada'}
                        color={isCompleted ? 'default' : 'success'}
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                      {contentType && (
                        <Chip label={contentType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      )}
                      {budget && (
                        <Chip label={budget} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      )}
                      {campaign.includes_product && (
                        <Chip label="Produto" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Button
                      component={Link}
                      href={`/dashboard/trabalhos/minhas-campanhas/${campaign._id}`}
                      variant="outlined"
                      size="small"
                      endIcon={<OpenIcon />}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        fontSize: '0.8rem',
                      }}
                    >
                      Ver campanha
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
          </Grid>
        </>
      )}
    </Box>
  );
}

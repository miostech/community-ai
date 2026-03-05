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
  TextField,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Feedback as RevisionIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

interface Campaign {
  _id: string;
  title: string;
  brand_name: string;
  content_type: string;
  content_usage: string;
}

interface Delivery {
  type: string;
  url: string;
  submitted_at: string;
  status: 'pending_review' | 'approved' | 'revision_requested';
  feedback?: string;
}

interface Application {
  _id: string;
  status: string;
  deliveries: Delivery[];
}

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning'; icon: React.ReactNode }> = {
  pending_review: {
    label: 'Pendente de revisão',
    color: 'warning',
    icon: <PendingIcon sx={{ fontSize: 16 }} />,
  },
  approved: {
    label: 'Aprovado',
    color: 'success',
    icon: <ApprovedIcon sx={{ fontSize: 16 }} />,
  },
  revision_requested: {
    label: 'Revisão solicitada',
    color: 'default',
    icon: <RevisionIcon sx={{ fontSize: 16 }} />,
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SubmeterConteudoPage() {
  const theme = useTheme();
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [url, setUrl] = useState('');
  const [type, setType] = useState('');

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
          setError('Você não está aprovado nesta campanha.');
          setApplication(null);
          return;
        }
        setApplication(app);
        setType(campData.campaign?.content_type || 'content');
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar.');
        setCampaign(null);
        setApplication(null);
      } finally {
        setLoading(false);
      }
    }
    if (campaignId) fetchData();
  }, [campaignId]);

  const isAffiliate = campaign?.content_usage === 'anuncios' || campaign?.content_usage === 'ambos';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!application || !url.trim()) {
      setError('Informe a URL.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/applications/${application._id}/deliveries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type || 'content', url: url.trim() }),
        }
      );
      const data = await res.json();
      if (res.ok && data.application) {
        setSuccess(true);
        setUrl('');
        setApplication(data.application);
      } else {
        setError(data.error || 'Erro ao enviar.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
        <TrabalhosTabs />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error && !campaign) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
        <TrabalhosTabs />
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Button
            component={Link}
            href={`/dashboard/trabalhos/minhas-campanhas/${campaignId}`}
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Voltar à campanha
          </Button>
        </Stack>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const deliveries = application?.deliveries || [];

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
      <TrabalhosTabs />

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Button
          component={Link}
          href={`/dashboard/trabalhos/minhas-campanhas/${campaignId}`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Voltar à campanha
        </Button>
      </Stack>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
        Submeter conteúdo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {campaign?.title}
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Conteúdo enviado com sucesso. A marca analisará e você poderá ver o status abaixo.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          {isAffiliate ? 'Link do vídeo postado' : 'URL do vídeo ou da foto'}
        </Typography>
        {isAffiliate ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
            Cole o link do vídeo em que você fala do produto (Instagram, TikTok, etc.) para a marca visualizar.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
            Link do vídeo ou da foto para aprovação da marca (ex.: Google Drive, link direto).
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="URL"
            placeholder={isAffiliate ? 'https://www.instagram.com/reel/...' : 'https://...'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            required
            size="small"
            type="url"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            disabled={submitting || !url.trim()}
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              py: 1.25,
            }}
          >
            {submitting ? 'Enviando...' : 'Enviar para aprovação'}
          </Button>
        </form>
      </Paper>

      {deliveries.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Entregas enviadas
          </Typography>
          <Stack spacing={1.5}>
            {deliveries.map((d, i) => {
              const cfg = DELIVERY_STATUS_CONFIG[d.status] || DELIVERY_STATUS_CONFIG.pending_review;
              return (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    {cfg.icon}
                    <Chip
                      label={cfg.label}
                      size="small"
                      color={cfg.color}
                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {formatDate(d.submitted_at)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    component="a"
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'primary.main',
                      fontSize: '0.8rem',
                      wordBreak: 'break-all',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {d.url}
                  </Typography>
                  {d.feedback && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Feedback: {d.feedback}
                    </Typography>
                  )}
                </Paper>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}

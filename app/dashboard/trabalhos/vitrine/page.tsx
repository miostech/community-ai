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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
  Inventory as ProductIcon,
  CheckCircle as AppliedIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

interface Campaign {
  _id: string;
  brand_name: string;
  brand_logo?: string;
  brand_instagram?: string;
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
  applications_count: number;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ugc: 'UGC',
  reels: 'Reels',
  stories: 'Stories',
  tiktok: 'TikTok',
  post_feed: 'Post Feed',
  outro: 'Outro',
};

function formatDeadline(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatBudget(cents?: number): string | null {
  if (!cents) return null;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function VitrineCampanhasPage() {
  const theme = useTheme();
  const { isMidiaKitComplete } = useAccount();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [pitch, setPitch] = useState('');
  const [contentProposal, setContentProposal] = useState('');
  const [isCustomer, setIsCustomer] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

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
    for (const c of campaigns) {
      for (const n of c.niches) set.add(n);
    }
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
      return matchSearch && matchNiche && matchType;
    });
  }, [campaigns, searchText, filterNiche, filterType]);

  function openApplyDialog(campaign: Campaign) {
    setSelectedCampaign(campaign);
    setPitch('');
    setContentProposal('');
    setIsCustomer(false);
    setApplyError('');
    setApplySuccess('');
    setApplyDialogOpen(true);
  }

  async function handleApply() {
    if (!selectedCampaign) return;
    if (!pitch.trim()) {
      setApplyError('O campo pitch é obrigatório.');
      return;
    }
    setApplying(true);
    setApplyError('');
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign._id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch, content_proposal: contentProposal, is_customer: isCustomer }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplySuccess('Candidatura enviada com sucesso!');
        setAppliedIds((prev) => new Set([...prev, selectedCampaign._id]));
        setTimeout(() => setApplyDialogOpen(false), 1500);
      } else {
        setApplyError(data.error || 'Erro ao enviar candidatura.');
      }
    } catch {
      setApplyError('Erro ao conectar com o servidor.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
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

      <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
          Vitrine de Campanhas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Explore campanhas de marcas e candidate-se.
        </Typography>
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
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {filtered.map((campaign) => {
            const hasApplied = appliedIds.has(campaign._id);
            const slotsLeft = campaign.slots - campaign.slots_filled;
            const slotsPercent = Math.min(100, (campaign.slots_filled / campaign.slots) * 100);
            const isFull = slotsLeft <= 0;
            const budget = formatBudget(campaign.budget_per_creator);
            const deadline = formatDeadline(campaign.application_deadline);

            return (
              <Paper
                key={campaign._id}
                elevation={0}
                sx={{
                  borderRadius: { xs: 2.5, sm: 3 },
                  border: 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s',
                  '&:hover': { boxShadow: 3 },
                }}
              >
                {/* Brand header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    px: { xs: 2, sm: 2.5 },
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                  }}
                >
                  <Avatar
                    src={campaign.brand_logo}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {campaign.brand_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
                    {campaign.brand_name}
                  </Typography>
                  {campaign.brand_instagram && (
                    <Typography variant="caption" color="text.secondary">
                      {campaign.brand_instagram}
                    </Typography>
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    label={CONTENT_TYPE_LABELS[campaign.content_type] || campaign.content_type}
                    size="small"
                    sx={{ fontSize: '0.65rem', fontWeight: 600, height: 20 }}
                  />
                </Stack>

                {/* Campaign body */}
                <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    {campaign.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}>
                    {campaign.description}
                  </Typography>

                  {/* Niches */}
                  {campaign.niches.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
                      {campaign.niches.map((n) => (
                        <Chip key={n} label={n} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                      ))}
                    </Stack>
                  )}

                  {/* Info pills */}
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {budget && (
                      <Grid size={{ xs: 6, sm: 'auto' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <MoneyIcon sx={{ fontSize: 15, color: 'success.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main', fontSize: { xs: '0.72rem', sm: '0.78rem' } }}>
                            {budget}
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    {campaign.includes_product && (
                      <Grid size={{ xs: 6, sm: 'auto' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <ProductIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.72rem', sm: '0.78rem' } }}>
                            Produto incluso
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    {deadline && (
                      <Grid size={{ xs: 6, sm: 'auto' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.72rem', sm: '0.78rem' } }}>
                            Candidaturas até {deadline}
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    <Grid size={{ xs: 6, sm: 'auto' }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.72rem', sm: '0.78rem' } }}>
                          {slotsLeft > 0 ? `${slotsLeft} vaga${slotsLeft !== 1 ? 's' : ''} disponível${slotsLeft !== 1 ? 'is' : ''}` : 'Vagas esgotadas'}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Slots progress */}
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                        {campaign.slots_filled} de {campaign.slots} vagas preenchidas
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                        {Math.round(slotsPercent)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={slotsPercent}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          background: isFull
                            ? theme.palette.error.main
                            : `linear-gradient(90deg, ${theme.palette.primary.main}, #9333ea)`,
                        },
                      }}
                    />
                  </Box>

                  {/* Deliverables */}
                  {campaign.deliverables.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.75, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                        Entregas esperadas
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {campaign.deliverables.map((d) => (
                          <Chip key={d} label={d} size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: alpha(theme.palette.primary.main, 0.07) }} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  {/* CTA */}
                  <Stack direction="row" justifyContent="flex-end">
                    {hasApplied ? (
                      <Chip
                        icon={<AppliedIcon sx={{ fontSize: '1rem !important' }} />}
                        label="Candidatura enviada"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.78rem' }}
                      />
                    ) : (
                      <Tooltip title={!isMidiaKitComplete ? 'Complete seu portfólio primeiro' : isFull ? 'Vagas esgotadas' : ''}>
                        <span>
                          <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={() => openApplyDialog(campaign)}
                            disabled={!isMidiaKitComplete || isFull}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            }}
                          >
                            Candidatar-se
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Apply dialog */}
      <Dialog open={applyDialogOpen} onClose={() => !applying && setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Candidatura: {selectedCampaign?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Conta para a marca por que você é a escolha ideal para essa campanha.
          </Typography>

          {applyError && <Alert severity="error" sx={{ mb: 2 }}>{applyError}</Alert>}
          {applySuccess && <Alert severity="success" sx={{ mb: 2 }}>{applySuccess}</Alert>}

          <Stack spacing={2}>
            <TextField
              label="Pitch *"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              fullWidth
              multiline
              rows={4}
              size="small"
              placeholder="Ex: Sou criadora de conteúdo de beleza há 3 anos, já usei produtos similares e tenho uma audiência engajada que se identifica com esse nicho..."
              helperText="Apresente-se e explique por que você é a creator certa para essa campanha."
            />
            <TextField
              label="Proposta de conteúdo (opcional)"
              value={contentProposal}
              onChange={(e) => setContentProposal(e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Ex: Eu faria um vídeo mostrando a rotina de skincare com o produto, com legenda e áudio em trend..."
              helperText="Descreva brevemente como você criaria o conteúdo."
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              onClick={() => setIsCustomer(!isCustomer)}
              sx={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.75,
                  border: 2,
                  borderColor: isCustomer ? 'primary.main' : 'divider',
                  bgcolor: isCustomer ? 'primary.main' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {isCustomer && <Box component="span" sx={{ color: 'white', fontSize: 13, lineHeight: 1 }}>✓</Box>}
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                Já sou cliente / já usei o produto desta marca
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setApplyDialogOpen(false)} disabled={applying} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            variant="contained"
            disabled={applying || !!applySuccess}
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
            }}
          >
            Enviar candidatura
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

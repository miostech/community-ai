'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
  alpha,
  useTheme,
  LinearProgress,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  Instagram as InstagramIcon,
  Videocam as VideocamIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

const MAX_PORTFOLIO_VIDEOS = 3;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.qt'];

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'nao_binario', label: 'Não-binário' },
  { value: 'prefiro_nao_dizer', label: 'Prefiro não dizer' },
];

const CATEGORY_OPTIONS = [
  { value: 'ugc', label: 'UGC Creator' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'ambos', label: 'Ambos (UGC + Influencer)' },
];

const NICHE_OPTIONS = [
  'Skincare', 'Maquiagem', 'Cabelos', 'Moda feminina', 'Moda masculina',
  'Streetwear', 'Luxo', 'Sustentabilidade', 'Receitas', 'Alimentação saudável',
  'Treino', 'Yoga', 'Corrida', 'Crossfit', 'Fotografia', 'Vlog', 'Podcast',
  'Dança', 'DIY', 'Organização', 'Produtividade', 'Marketing digital',
  'Empreendedorismo', 'Investimentos', 'Cripto', 'Reviews', 'Unboxing',
  'ASMR', 'Comédia', 'Família', 'Bebês', 'Cachorros', 'Gatos',
  'Viagem nacional', 'Viagem internacional', 'Carros', 'Motos', 'Outro',
];

const TikTokIcon = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a4.85 4.85 0 0 0 3.77 4.22v-3.29a4.85 4.85 0 0 1-1-.4z" />
  </svg>
);

interface FormData {
  birth_date: string;
  gender: string;
  category: string;
  niches: string[];
  address_country: string;
  address_state: string;
  address_city: string;
  interest_product_campaigns: boolean;
  address_zip: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  link_instagram: string;
  link_tiktok: string;
  payment_pix_key: string;
  payment_revolut_account: string;
}

interface VideoSlot {
  url: string | null;
  uploading: boolean;
  progress: number;
}

const REQUIRED_FIELDS: { key: keyof FormData; label: string }[] = [
  { key: 'birth_date', label: 'Data de nascimento' },
  { key: 'gender', label: 'Gênero' },
  { key: 'category', label: 'Tipo de atuação' },
  { key: 'niches', label: 'Nicho de atuação' },
  { key: 'address_country', label: 'País' },
  { key: 'link_instagram', label: 'Instagram' },
  { key: 'link_tiktok', label: 'TikTok' },
];

function getCompletionPercentage(data: FormData, videoCount: number): number {
  let filled = 0;
  const total = REQUIRED_FIELDS.length + 1; // +1 for videos

  for (const field of REQUIRED_FIELDS) {
    const value = data[field.key];
    if (field.key === 'niches') {
      if (Array.isArray(value) && value.length > 0) filled++;
    } else if (typeof value === 'string' && value.trim()) {
      filled++;
    }
  }

  if (videoCount >= MAX_PORTFOLIO_VIDEOS) filled++;

  return Math.round((filled / total) * 100);
}

function getMissingFields(data: FormData, videoCount: number): string[] {
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const value = data[field.key];
    if (field.key === 'niches') {
      if (!Array.isArray(value) || value.length === 0) missing.push(field.label);
    } else if (!value || (typeof value === 'string' && !value.trim())) {
      missing.push(field.label);
    }
  }
  if (videoCount < MAX_PORTFOLIO_VIDEOS) {
    missing.push(`Vídeos do portfólio (${videoCount}/${MAX_PORTFOLIO_VIDEOS})`);
  }
  return missing;
}

// Fields that block saving (videos are optional for saving, required only for full completion)
function getBlockingFields(data: FormData): string[] {
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const value = data[field.key];
    if (field.key === 'niches') {
      if (!Array.isArray(value) || value.length === 0) missing.push(field.label);
    } else if (!value || (typeof value === 'string' && !value.trim())) {
      missing.push(field.label);
    }
  }
  if (data.interest_product_campaigns) {
    if (!data.address_zip?.trim()) missing.push('CEP (entrega de produtos)');
    if (!data.address_street?.trim()) missing.push('Rua (entrega de produtos)');
    if (!data.address_number?.trim()) missing.push('Número (entrega de produtos)');
    if (!data.address_neighborhood?.trim()) missing.push('Bairro (entrega de produtos)');
  }
  return missing;
}

export default function PortfolioPage() {
  const theme = useTheme();
  const { account, updateAccount, isLoading: accountLoading } = useAccount();
  const [formData, setFormData] = useState<FormData>({
    birth_date: '',
    gender: '',
    category: '',
    niches: [],
    address_country: '',
    address_state: '',
    address_city: '',
    interest_product_campaigns: false,
    address_zip: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    link_instagram: '',
    link_tiktok: '',
    payment_pix_key: '',
    payment_revolut_account: '',
  });
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>(
    Array.from({ length: MAX_PORTFOLIO_VIDEOS }, () => ({ url: null, uploading: false, progress: 0 }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!account) return;
    setFormData({
      birth_date: account.birth_date
        ? new Date(account.birth_date).toISOString().split('T')[0]
        : '',
      gender: account.gender || '',
      category: account.category || '',
      niches: account.niches || [],
      address_country: account.address_country || '',
      address_state: account.address_state || '',
      address_city: account.address_city || '',
      interest_product_campaigns: !!(account as { interest_product_campaigns?: boolean }).interest_product_campaigns,
      address_zip: (account as { address_zip?: string }).address_zip || '',
      address_street: (account as { address_street?: string }).address_street || '',
      address_number: (account as { address_number?: string }).address_number || '',
      address_complement: (account as { address_complement?: string }).address_complement || '',
      address_neighborhood: (account as { address_neighborhood?: string }).address_neighborhood || '',
      link_instagram: account.link_instagram || '',
      link_tiktok: account.link_tiktok || '',
      payment_pix_key: (account as { payment_pix_key?: string }).payment_pix_key || '',
      payment_revolut_account: (account as { payment_revolut_account?: string }).payment_revolut_account || '',
    });

    setVideoSlots(
      Array.from({ length: MAX_PORTFOLIO_VIDEOS }, (_, i) => ({
        url: account.portfolio_videos?.[i] || null,
        uploading: false,
        progress: 0,
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id]);

  const handleChange = (field: keyof FormData, value: string | string[] | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const uploadVideo = useCallback(async (file: File, slotIndex: number) => {
    setVideoSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { url: null, uploading: true, progress: 0 };
      return next;
    });

    // Normalize empty MIME type (e.g. iOS Safari .mov files)
    const resolvedContentType = file.type || 'video/quicktime';

    try {
      const sasRes = await fetch('/api/portfolio/media/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: resolvedContentType,
          fileSize: file.size,
        }),
      });

      if (!sasRes.ok) {
        const data = await sasRes.json();
        throw new Error(data.error || 'Erro ao preparar upload');
      }

      const { sasUrl, finalUrl } = await sasRes.json();

      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setVideoSlots((prev) => {
              const next = [...prev];
              next[slotIndex] = { ...next[slotIndex], progress: pct };
              return next;
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error('Falha no upload'));
        });

        xhr.addEventListener('error', () => reject(new Error('Erro de rede no upload')));
        xhr.open('PUT', sasUrl);
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
        xhr.setRequestHeader('Content-Type', resolvedContentType);
        xhr.send(file);
      });

      setVideoSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { url: finalUrl, uploading: false, progress: 100 };
        return next;
      });

      return finalUrl;
    } catch (err) {
      setVideoSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { url: null, uploading: false, progress: 0 };
        return next;
      });
      throw err;
    }
  }, []);

  const handleVideoSelect = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (e.target) e.target.value = '';

    // Some browsers (especially iOS Safari) may return an empty MIME type for .mov files
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const typeOk = ALLOWED_VIDEO_TYPES.includes(file.type) || (!file.type && ALLOWED_VIDEO_EXTENSIONS.includes(ext));
    if (!typeOk) {
      setError('Formato não suportado. Use MP4, WebM ou MOV.');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError('Vídeo muito grande. Máximo 100MB.');
      return;
    }

    try {
      await uploadVideo(file, slotIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar vídeo');
    }
  };

  const handleRemoveVideo = async (slotIndex: number) => {
    const videoUrl = videoSlots[slotIndex].url;
    if (!videoUrl) return;

    setVideoSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { url: null, uploading: false, progress: 0 };
      return next;
    });

    try {
      await fetch('/api/portfolio/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });
    } catch {
      // best-effort cleanup
    }
  };

  const handleSave = async () => {
    const videoUrls = videoSlots.filter((s) => s.url).map((s) => s.url as string);
    const blocking = getBlockingFields(formData);
    if (blocking.length > 0) {
      setError(`Preencha os campos obrigatórios: ${blocking.join(', ')}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        ...formData,
        birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : null,
        portfolio_videos: videoUrls,
      };
      const success = await updateAccount(payload as any);
      if (success) {
        setSuccessMessage('Portfólio salvo com sucesso!');
      } else {
        setError('Erro ao salvar. Tente novamente.');
      }
    } catch (err) {
      console.error('🔴 handleSave catch:', err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const videoCount = videoSlots.filter((s) => s.url).length;
  const completion = getCompletionPercentage(formData, videoCount);
  const missingFields = getMissingFields(formData, videoCount);
  const isComplete = missingFields.length === 0;
  const isAnyUploading = videoSlots.some((s) => s.uploading);

  if (accountLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 4 }, pb: { xs: 12, sm: 4 } }}>
      <TrabalhosTabs />

      <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}
        >
          Portfólio
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Preencha seu perfil para que as marcas possam te encontrar.
        </Typography>
      </Stack>

      {/* Barra de progresso */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: { xs: 2.5, sm: 3 },
          border: 1,
          borderColor: isComplete ? 'success.main' : 'divider',
          bgcolor: isComplete
            ? alpha(theme.palette.success.main, 0.04)
            : 'background.paper',
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {isComplete ? (
              <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
            ) : (
              <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            )}
            <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
              {isComplete ? 'Perfil completo!' : 'Perfil incompleto'}
            </Typography>
          </Stack>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            {completion}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={completion}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: isComplete
                ? theme.palette.success.main
                : 'linear-gradient(135deg, #3b82f6, #9333ea)',
            },
          }}
        />
        {!isComplete && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.68rem' }}>
            Faltam: {missingFields.join(', ')}
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: { xs: '0.78rem', sm: '0.875rem' } }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={{ xs: 2, sm: 3 }}>
        {/* Dados Pessoais */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Dados Pessoais
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Data de nascimento *"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              label="Gênero *"
              select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              fullWidth
              size="small"
            >
              {GENDER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {/* Categoria e Nichos */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Tipo de Atuação e Nichos
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Tipo de atuação *"
              select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              fullWidth
              size="small"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              multiple
              options={NICHE_OPTIONS}
              value={formData.niches}
              onChange={(_, newValue) => handleChange('niches', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nichos de atuação *"
                  size="small"
                  placeholder="Selecione pelo menos um"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option}
                      size="small"
                      {...tagProps}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                        fontWeight: 500,
                        fontSize: '0.72rem',
                        height: 26,
                      }}
                    />
                  );
                })
              }
            />
          </Stack>
        </Paper>

        {/* Localização */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Localização
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="País *"
              value={formData.address_country}
              onChange={(e) => handleChange('address_country', e.target.value)}
              fullWidth
              size="small"
              placeholder="Ex: Brasil"
            />
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Estado"
                value={formData.address_state}
                onChange={(e) => handleChange('address_state', e.target.value)}
                fullWidth
                size="small"
                placeholder="Ex: SP"
              />
              <TextField
                label="Cidade"
                value={formData.address_city}
                onChange={(e) => handleChange('address_city', e.target.value)}
                fullWidth
                size="small"
                placeholder="Ex: São Paulo"
              />
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.interest_product_campaigns}
                  onChange={(e) => handleChange('interest_product_campaigns', e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label="Tenho interesse em campanhas de produtos?"
              sx={{ alignItems: 'flex-start', mt: 0.5 }}
            />
            {formData.interest_product_campaigns && (
              <Stack spacing={2} sx={{ pl: 3.5, borderLeft: 2, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Endereço completo para entrega de produtos *
                </Typography>
                <TextField
                  label="CEP *"
                  value={formData.address_zip}
                  onChange={(e) => handleChange('address_zip', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="00000-000"
                />
                <TextField
                  label="Rua / Logradouro *"
                  value={formData.address_street}
                  onChange={(e) => handleChange('address_street', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Nome da rua"
                />
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    label="Número *"
                    value={formData.address_number}
                    onChange={(e) => handleChange('address_number', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Nº"
                  />
                  <TextField
                    label="Complemento"
                    value={formData.address_complement}
                    onChange={(e) => handleChange('address_complement', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Apto, bloco..."
                  />
                </Stack>
                <TextField
                  label="Bairro *"
                  value={formData.address_neighborhood}
                  onChange={(e) => handleChange('address_neighborhood', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Bairro"
                />
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Redes Sociais */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Redes Sociais
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Instagram *"
              value={formData.link_instagram}
              onChange={(e) => handleChange('link_instagram', e.target.value)}
              fullWidth
              size="small"
              placeholder="@seuusuario"
              slotProps={{
                input: {
                  startAdornment: (
                    <InstagramIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} />
                  ),
                },
              }}
            />
            <TextField
              label="TikTok *"
              value={formData.link_tiktok}
              onChange={(e) => handleChange('link_tiktok', e.target.value)}
              fullWidth
              size="small"
              placeholder="@seuusuario"
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.disabled', display: 'flex' }}>
                      <TikTokIcon />
                    </Box>
                  ),
                },
              }}
            />
          </Stack>
        </Paper>

        {/* Recebimento de pagamentos */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
            <MoneyIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Recebimento de pagamentos
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontSize: '0.75rem' }}>
            Informe onde você deseja receber os pagamentos das campanhas pagas. Pode ser sua chave PIX (Brasil) ou sua conta Revolut.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Chave PIX"
              value={formData.payment_pix_key}
              onChange={(e) => handleChange('payment_pix_key', e.target.value)}
              fullWidth
              size="small"
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              helperText="Para receber em reais (Brasil)"
            />
            <TextField
              label="Conta Revolut"
              value={formData.payment_revolut_account}
              onChange={(e) => handleChange('payment_revolut_account', e.target.value)}
              fullWidth
              size="small"
              placeholder="E-mail ou @ do Revolut"
              helperText="Para receber em outras moedas / internacional"
            />
          </Stack>
        </Paper>

        {/* Vídeos do Portfólio */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Vídeos do Portfólio
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontSize: '0.7rem' }}>
            Envie até {MAX_PORTFOLIO_VIDEOS} vídeos que mostrem seu trabalho. Você pode salvar e adicionar os outros depois. Os {MAX_PORTFOLIO_VIDEOS} vídeos são necessários para o perfil ficar completo. (MP4, WebM ou MOV — máx. 100MB cada)
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: { xs: 1, sm: 1.5 },
            }}
          >
            {videoSlots.map((slot, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  aspectRatio: '9/16',
                  borderRadius: { xs: 2, sm: 2.5 },
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.04) : 'grey.50',
                  border: '2px dashed',
                  borderColor: slot.url ? 'transparent' : 'divider',
                  transition: 'all 0.2s',
                  ...(!slot.url && !slot.uploading && {
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.primary.main, 0.04),
                    },
                  }),
                }}
                onClick={() => {
                  if (!slot.url && !slot.uploading) {
                    fileInputRefs.current[index]?.click();
                  }
                }}
              >
                {slot.url ? (
                  <>
                    <Box
                      component="video"
                      src={slot.url}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      muted
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />

                    <Box
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: alpha('#000', 0.6),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {index + 1}
                    </Box>

                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVideo(index);
                      }}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: alpha('#000', 0.6),
                        color: 'white',
                        width: 26,
                        height: 26,
                        backdropFilter: 'blur(4px)',
                        '&:hover': { bgcolor: 'error.main' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </>
                ) : slot.uploading ? (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    sx={{ height: '100%', px: 1 }}
                  >
                    <CircularProgress size={28} />
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {slot.progress}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={slot.progress}
                      sx={{
                        width: '80%',
                        height: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    />
                  </Stack>
                ) : (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.5}
                    sx={{ height: '100%' }}
                  >
                    <Box
                      sx={{
                        width: { xs: 36, sm: 44 },
                        height: { xs: 36, sm: 44 },
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloudUploadIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: 'primary.main' }} />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, textAlign: 'center', px: 0.5 }}
                    >
                      Vídeo {index + 1}
                    </Typography>
                  </Stack>
                )}

                <input
                  ref={(el) => { fileInputRefs.current[index] = el; }}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/mov"
                  onChange={(e) => handleVideoSelect(index, e)}
                  style={{ display: 'none' }}
                />
              </Box>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', textAlign: 'center', fontSize: '0.68rem' }}>
            {videoCount} de {MAX_PORTFOLIO_VIDEOS} vídeos enviados
            {videoCount > 0 && ' • Passe o mouse para pré-visualizar'}
          </Typography>
        </Paper>

        {/* Botão Salvar */}
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={isSaving || isAnyUploading}
          startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={{
            py: { xs: 1.2, sm: 1.5 },
            borderRadius: 3,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            },
          }}
        >
          {isSaving ? 'Salvando...' : 'Salvar Portfólio'}
        </Button>
      </Stack>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

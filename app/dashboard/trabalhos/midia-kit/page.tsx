'use client';

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  Instagram as InstagramIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { TrabalhosTabs } from '@/components/trabalhos/TrabalhosTabs';

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
  'Skincare',
  'Maquiagem',
  'Cabelos',
  'Moda feminina',
  'Moda masculina',
  'Streetwear',
  'Luxo',
  'Sustentabilidade',
  'Receitas',
  'Alimentação saudável',
  'Treino',
  'Yoga',
  'Corrida',
  'Crossfit',
  'Fotografia',
  'Vlog',
  'Podcast',
  'Dança',
  'DIY',
  'Organização',
  'Produtividade',
  'Marketing digital',
  'Empreendedorismo',
  'Investimentos',
  'Cripto',
  'Reviews',
  'Unboxing',
  'ASMR',
  'Comédia',
  'Família',
  'Bebês',
  'Cachorros',
  'Gatos',
  'Viagem nacional',
  'Viagem internacional',
  'Carros',
  'Motos',
  'Outro',
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
  link_instagram: string;
  link_tiktok: string;
  link_media_kit: string;
}

const REQUIRED_FIELDS: { key: keyof FormData; label: string }[] = [
  { key: 'birth_date', label: 'Data de nascimento' },
  { key: 'gender', label: 'Gênero' },
  { key: 'category', label: 'Tipo de atuação' },
  { key: 'niches', label: 'Nicho de atuação' },
  { key: 'address_country', label: 'País' },
  { key: 'link_instagram', label: 'Instagram' },
  { key: 'link_tiktok', label: 'TikTok' },
  { key: 'link_media_kit', label: 'Link do mídia kit' },
];

function getCompletionPercentage(data: FormData): number {
  let filled = 0;
  const total = REQUIRED_FIELDS.length;

  for (const field of REQUIRED_FIELDS) {
    const value = data[field.key];
    if (field.key === 'niches') {
      if (Array.isArray(value) && value.length > 0) filled++;
    } else if (typeof value === 'string' && value.trim()) {
      filled++;
    }
  }

  return Math.round((filled / total) * 100);
}

function getMissingFields(data: FormData): string[] {
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const value = data[field.key];
    if (field.key === 'niches') {
      if (!Array.isArray(value) || value.length === 0) missing.push(field.label);
    } else if (!value || (typeof value === 'string' && !value.trim())) {
      missing.push(field.label);
    }
  }
  return missing;
}

export default function MidiaKitPage() {
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
    link_instagram: '',
    link_tiktok: '',
    link_media_kit: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
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
        link_instagram: account.link_instagram || '',
        link_tiktok: account.link_tiktok || '',
        link_media_kit: account.link_media_kit || '',
      });
    }
  }, [account]);

  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const missing = getMissingFields(formData);
    if (missing.length > 0) {
      setError(`Preencha os campos obrigatórios: ${missing.join(', ')}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        ...formData,
        birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : null,
      };
      const success = await updateAccount(payload as any);
      if (success) {
        setSuccessMessage('Mídia Kit salvo com sucesso!');
      } else {
        setError('Erro ao salvar. Tente novamente.');
      }
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const completion = getCompletionPercentage(formData);
  const missingFields = getMissingFields(formData);
  const isComplete = missingFields.length === 0;

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
          Mídia Kit
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

        {/* Endereço */}
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

        {/* Mídia Kit Link */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Link do Mídia Kit *
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block', fontSize: '0.7rem' }}>
            Cole o link do seu mídia kit (PDF, Canva, Google Drive, etc).
          </Typography>
          <TextField
            value={formData.link_media_kit}
            onChange={(e) => handleChange('link_media_kit', e.target.value)}
            fullWidth
            size="small"
            placeholder="https://..."
            slotProps={{
              input: {
                startAdornment: (
                  <LinkIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} />
                ),
              },
            }}
          />
        </Paper>

        {/* Botão Salvar */}
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={isSaving}
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
          {isSaving ? 'Salvando...' : 'Salvar Mídia Kit'}
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

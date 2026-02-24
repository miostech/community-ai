'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useAccount } from '@/contexts/AccountContext';
import { useCourses } from '@/contexts/CoursesContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Visibility as VisibilityIcon,
  PhotoCamera as PhotoCameraIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Support as SupportIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { CURSOS, courseIdsIncludeCourse } from '@/lib/courses';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_country_code: string;
  avatar_url: string;
  link_instagram: string;
  link_tiktok: string;
  link_youtube: string;
}

export default function PerfilPage() {
  const { data: session } = useSession();
  const { account, isLoading: accountLoading, refreshAccount, setAccountFromResponse } = useAccount();
  const { courseIds: myCourseIds, loading: coursesLoading } = useCourses();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    phone_country_code: '+55',
    avatar_url: '',
    link_instagram: '',
    link_tiktok: '',
    link_youtube: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSyncingInstagramAvatar, setIsSyncingInstagramAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Botão "Usar foto do Instagram" só aparece uma vez por dia (24h desde o último uso). */
  const canUseInstagramAvatar =
    !!formData.link_instagram?.trim() &&
    (!account?.instagram_avatar_used_at ||
      Date.now() - new Date(account.instagram_avatar_used_at).getTime() > 24 * 60 * 60 * 1000);

  useEffect(() => {
    if (account) {
      setFormData({
        first_name: account.first_name || '',
        last_name: account.last_name || '',
        email: account.email || '',
        phone: account.phone || '',
        phone_country_code: account.phone_country_code || '+55',
        avatar_url: account.avatar_url || '',
        link_instagram: account.link_instagram || '',
        link_tiktok: account.link_tiktok || '',
        link_youtube: account.link_youtube || '',
      });
      setIsLoading(false);
    } else if (!accountLoading) {
      setIsLoading(false);
    }
  }, [account, accountLoading]);


  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await fetch('/api/accounts/avatar', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar imagem');
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, avatar_url: data.avatar_url }));
      await refreshAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setError(null);

    try {
      const response = await fetch('/api/accounts/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover imagem');
      }

      setFormData((prev) => ({ ...prev, avatar_url: '' }));
      await refreshAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover imagem');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSyncInstagramAvatar = async () => {
    if (!formData.link_instagram?.trim()) return;

    setIsSyncingInstagramAvatar(true);
    setError(null);

    try {
      const response = await fetch('/api/accounts/sync-instagram-avatar', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar foto do Instagram');
      }

      const data = await response.json();
      if (data.account) {
        const updatedAccount = data.account as import('@/contexts/AccountContext').Account;
        setFormData((prev) => ({ ...prev, avatar_url: updatedAccount.avatar_url ?? prev.avatar_url }));
        setAccountFromResponse(account ? { ...account, ...updatedAccount } : updatedAccount);
        await refreshAccount();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar foto do Instagram');
    } finally {
      setIsSyncingInstagramAvatar(false);
    }
  };

  const handleCancel = () => {
    if (account) {
      setFormData({
        first_name: account.first_name || '',
        last_name: account.last_name || '',
        email: account.email || '',
        phone: account.phone || '',
        phone_country_code: account.phone_country_code || '+55',
        avatar_url: account.avatar_url || '',
        link_instagram: account.link_instagram || '',
        link_tiktok: account.link_tiktok || '',
        link_youtube: account.link_youtube || '',
      });
    }
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!formData.phone.trim()) {
      setError('O telefone é obrigatório para usar a comunidade');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/accounts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar perfil');
      }

      setSuccessMessage('Dados salvos com sucesso.');
      setError(null);
      await refreshAccount();
      // Esconde o alerta de sucesso após 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil');
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  if (isLoading) {
    const loadingName = `${formData.first_name} ${formData.last_name}`.trim() || 'Usuário';
    return (
      <Box sx={{ maxWidth: 896, mx: 'auto', pb: { xs: 12, sm: 4 } }}>
        <AppBar
          position="fixed"
          sx={{
            width: { xs: '100%', md: 'calc(100% - 256px)' },
          }}
        >
          <Box sx={{ maxWidth: 896, mx: 'auto', width: '100%' }}>
            <Toolbar sx={{ px: 2 }}>
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
                  {loadingName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Meu Perfil
                </Typography>
              </Stack>
            </Toolbar>
          </Box>
        </AppBar>
        <Toolbar />
        <Box sx={{ px: { xs: 2, sm: 3 } }}>
          <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Paper>
        </Box>
      </Box>
    );
  }

  const displayName = `${formData.first_name} ${formData.last_name}`.trim() || 'Usuário';

  const nameToSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <Box sx={{ maxWidth: 896, mx: 'auto', pb: { xs: 12, sm: 4 } }}>
      {/* AppBar Fixo */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: 'calc(100% - 256px)' },
        }}
      >
        <Box sx={{ maxWidth: 896, mx: 'auto', width: '100%' }}>
          <Toolbar sx={{ px: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                src={formData.avatar_url || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Meu Perfil
              </Typography>
            </Stack>
          </Toolbar>
        </Box>
      </AppBar>

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: '72px', sm: '80px' } }}>
        {!formData.phone.trim() && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
          >
            O telefone é obrigatório para usar a comunidade. Preencha o campo abaixo e salve para continuar.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={4}>
            {/* Foto de Perfil */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Foto de Perfil
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                alignItems={{ xs: 'center', sm: 'flex-start' }}
              >
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  {isUploadingAvatar ? (
                    <Box
                      sx={{
                        width: { xs: 96, sm: 128 },
                        height: { xs: 96, sm: 128 },
                        borderRadius: '50%',
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 4,
                        borderColor: 'divider',
                      }}
                    >
                      <CircularProgress size={32} />
                    </Box>
                  ) : formData.avatar_url ? (
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={formData.avatar_url}
                        alt="Avatar"
                        sx={{
                          width: { xs: 96, sm: 128 },
                          height: { xs: 96, sm: 128 },
                          border: 4,
                          borderColor: 'divider',
                        }}
                      />
                      <IconButton
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: { xs: -4, sm: -8 },
                          right: { xs: -4, sm: -8 },
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' },
                          boxShadow: 2,
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Avatar
                      sx={{
                        width: { xs: 96, sm: 128 },
                        height: { xs: 96, sm: 128 },
                        background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                        fontSize: { xs: '2rem', sm: '2.5rem' },
                        fontWeight: 'bold',
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Box>

                <Box sx={{ flex: 1, width: '100%', textAlign: { xs: 'center', sm: 'left' } }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mb: 1.5, gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar || isSyncingInstagramAvatar}
                      startIcon={<PhotoCameraIcon />}
                      size="small"
                    >
                      {isUploadingAvatar ? 'Enviando...' : formData.avatar_url ? 'Alterar foto' : 'Adicionar foto'}
                    </Button>
                    {canUseInstagramAvatar && (
                      <Button
                        variant="outlined"
                        onClick={handleSyncInstagramAvatar}
                        disabled={isUploadingAvatar || isSyncingInstagramAvatar}
                        startIcon={<InstagramIcon />}
                        size="small"
                      >
                        {isSyncingInstagramAvatar ? 'Buscando...' : 'Usar foto do Instagram'}
                      </Button>
                    )}
                    <Button
                      component={Link}
                      href={`/dashboard/comunidade/perfil/${nameToSlug(displayName)}`}
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      size="small"
                    >
                      Ver perfil público
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Imagem quadrada de 400x400px ou maior (4K suportado). JPG, PNG, WebP ou GIF. Máximo 10MB.
                    {canUseInstagramAvatar && ' Ou use a foto do seu perfil do Instagram (uma vez por dia).'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Informações Pessoais */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Informações Pessoais
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Nome"
                    value={formData.first_name}
                    onChange={(e) => updateField('first_name', e.target.value)}
                    placeholder="Seu nome"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Sobrenome"
                    value={formData.last_name}
                    onChange={(e) => updateField('last_name', e.target.value)}
                    placeholder="Seu sobrenome"
                    fullWidth
                    size="small"
                  />
                </Stack>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="seu@email.com"
                  fullWidth
                  size="small"
                />
              </Stack>
            </Box>

            <Divider />

            {/* Contato */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Contato
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Seu telefone para contato direto com a comunidade{' '}
                <Typography component="span" variant="caption" color="warning.main" fontWeight={500}>
                  (obrigatório)
                </Typography>
              </Typography>
              <PhoneInput
                label="Telefone/WhatsApp"
                value={formData.phone}
                countryCode={formData.phone_country_code}
                onValueChange={(value: string) => updateField('phone', value)}
                onCountryCodeChange={(code: string) => updateField('phone_country_code', code)}
                error={!formData.phone.trim()}
              />
            </Box>

            <Divider />

            {/* Redes Sociais */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Redes Sociais
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Preencha os que quiser. Os links aparecerão no seu perfil quando alguém visualizar. Coloque apenas o nome do usuário, sem o @.
              </Typography>

              <Stack spacing={3}>
                {/* Instagram */}
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Instagram
                  </Typography>
                  <TextField
                    value={formData.link_instagram}
                    onChange={(e) => updateField('link_instagram', e.target.value.replace('@', ''))}
                    placeholder="seu_usuario"
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography color="text.secondary">@</Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {formData.link_instagram && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Link: instagram.com/{formData.link_instagram}
                    </Typography>
                  )}
                </Box>

                {/* TikTok */}
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    TikTok
                  </Typography>
                  <TextField
                    value={formData.link_tiktok}
                    onChange={(e) => updateField('link_tiktok', e.target.value.replace('@', ''))}
                    placeholder="seu_usuario"
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography color="text.secondary">@</Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {formData.link_tiktok && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Link: tiktok.com/@{formData.link_tiktok}
                    </Typography>
                  )}
                </Box>

                {/* YouTube */}
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    YouTube
                  </Typography>
                  <TextField
                    value={formData.link_youtube}
                    onChange={(e) => updateField('link_youtube', e.target.value.replace('@', ''))}
                    placeholder="seu_canal"
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography color="text.secondary">@</Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {formData.link_youtube && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Link: youtube.com/@{formData.link_youtube}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>

            {/* Aparência (tema) — visível só no mobile, onde não há sidebar com toggle */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Divider />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ py: 2 }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Aparência
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modo escuro ou claro
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'}
                  size="medium"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                >
                  {resolvedTheme === 'dark' ? (
                    <LightModeIcon />
                  ) : (
                    <DarkModeIcon />
                  )}
                </IconButton>
              </Stack>
            </Box>

            <Divider />

            {/* Botões de Ação */}
            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
            >
              {/* <Button
                variant="text"
                onClick={handleCancel}
                fullWidth
                sx={{ display: { xs: 'flex', sm: 'inline-flex' }, width: { sm: 'auto' } }}
              >
               
                Cancelar
              </Button> */}
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving || !formData.phone.trim()}
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                fullWidth
                sx={{ display: { xs: 'flex', sm: 'inline-flex' }, width: { sm: 'auto' } }}
              >
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Meus cursos */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Cursos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Acesse seus cursos e desbloqueie os próximos.
          </Typography>
          {coursesLoading ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Verificando cursos...
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {CURSOS.map((curso) => {
                const hasAccess = courseIdsIncludeCourse(myCourseIds, curso);
                return (
                  <Stack
                    key={curso.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <SchoolIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {curso.label}
                      </Typography>
                      {hasAccess && (
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} titleAccess="Você tem acesso" />
                      )}
                    </Stack>
                    {hasAccess ? (
                      <Typography variant="caption" color="text.secondary">
                        Acessar
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        // endIcon={<ShoppingCartIcon />}
                        href={curso.kiwifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        component="a"
                      >
                        Adquirir
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>

        {/* Acesso ao suporte */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Suporte
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Precisa de ajuda? Fale com a gente pelo WhatsApp.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              href="https://wa.me/5511964056099"
              target="_blank"
              rel="noopener noreferrer"
              component="a"
              // startIcon={<SupportIcon />}
              fullWidth
              sx={{ width: { sm: 'auto' } }}
            >
              Acessar suporte
            </Button>
          </Stack>
        </Paper>

        {/* Sair da conta */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Sair da conta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Desconectar desta conta no dispositivo
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              fullWidth
              sx={{ width: { sm: 'auto' } }}
            >
              Sair
            </Button>
          </Stack>
        </Paper>

        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={5000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 7 }}
        >
          <Alert
            severity="success"
            onClose={() => setSuccessMessage(null)}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

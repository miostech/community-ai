'use client';

import { useState, useEffect } from 'react';
import { Snackbar, Button, Typography, Box, Alert } from '@mui/material';
import { NotificationsActive as NotificationsActiveIcon } from '@mui/icons-material';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const STORAGE_VISITED = 'push_has_visited';
const STORAGE_DISMISSED = 'push_prompt_dismissed_at';
const DISMISS_DAYS = 7;

function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  const dismissedAt = localStorage.getItem(STORAGE_DISMISSED);
  if (!dismissedAt) return false;
  const elapsed = Date.now() - parseInt(dismissedAt, 10);
  return elapsed <= DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function PushPromptBanner() {
  const { pushSupported, isSubscribed, permission, subscribe, isLoading, error } = usePushNotifications();
  const [open, setOpen] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);
  const [canShow, setCanShow] = useState(false);

  // Marca "já visitou" ao sair da página ou após 30s (fallback no mobile, onde beforeunload pode não disparar)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHasVisited(localStorage.getItem(STORAGE_VISITED) === 'true');
    const onLeave = () => localStorage.setItem(STORAGE_VISITED, 'true');
    window.addEventListener('beforeunload', onLeave);
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_VISITED, 'true');
      setHasVisited(true);
    }, 30000);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!pushSupported || isSubscribed || permission === 'denied' || !hasVisited || isDismissedRecently()) {
      setCanShow(false);
      setOpen(false);
      return;
    }
    setCanShow(true);
  }, [pushSupported, isSubscribed, permission, hasVisited]);

  useEffect(() => {
    if (!canShow) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [canShow]);

  const handleActivate = async () => {
    const ok = await subscribe();
    if (ok) setOpen(false);
    // Se deu erro (ex.: iPhone em aba normal), a mensagem aparece no Alert abaixo
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_DISMISSED, String(Date.now()));
    }
    setOpen(false);
    setCanShow(false);
  };

  if (!canShow) return null;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 80, md: 24 } }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          px: 2,
          py: 1.5,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderRadius: 2,
          boxShadow: 3,
          border: '1px solid',
          borderColor: 'divider',
          maxWidth: 360,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NotificationsActiveIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Receba notificações no celular
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Curtidas, comentários e novidades mesmo com o site fechado.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Button
            size="small"
            variant="contained"
            onClick={handleActivate}
            disabled={isLoading}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {isLoading ? '...' : 'Ativar'}
          </Button>
            <Button size="small" variant="text" onClick={handleDismiss} sx={{ minWidth: 0 }}>
              Agora não
            </Button>
          </Box>
        </Box>
        {error && (
          <Alert severity="info" sx={{ py: 0.5, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
            {error}
          </Alert>
        )}
      </Box>
    </Snackbar>
  );
}

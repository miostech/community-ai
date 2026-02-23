'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  InstallDesktop as InstallDesktopIcon,
  Add as AddIcon,
  Laptop as LaptopIcon,
  PhoneIphone as IphoneIcon,
  Android as AndroidIcon,
} from '@mui/icons-material';

type Platform = 'ios' | 'android' | 'mac' | 'desktop' | 'unknown';

function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os x|darwin/.test(ua)) return 'mac';
  return 'desktop';
}

const platformLabels: Record<Platform, string> = {
  ios: 'iPhone / iPad',
  android: 'Android',
  mac: 'Mac',
  desktop: 'Computador (Windows/Linux)',
  unknown: 'Seu dispositivo',
};

interface AddToDesktopModalProps {
  open: boolean;
  onClose: () => void;
  siteName?: string;
}

export function AddToDesktopModal({
  open,
  onClose,
  siteName = 'DOME',
}: AddToDesktopModalProps) {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setPlatform(getPlatform());
  }, [open]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') onClose();
    } finally {
      setInstalling(false);
    }
  };

  const steps = (() => {
    switch (platform) {
      case 'ios':
        return [
          'Toque no ícone de compartilhar (quadrado com seta para cima) na barra do Safari',
          'Role e toque em "Adicionar à Tela de Início"',
          'Toque em "Adicionar" no canto superior direito',
        ];
      case 'android':
        return [
          'Toque nos três pontos ⋮ no canto superior direito do Chrome (igual no computador)',
          'No menu, procure e toque em "Adicionar à tela inicial" ou "Instalar app"',
          'Confirme em "Adicionar" ou "Instalar"',
          'O atalho aparecerá na tela inicial do celular para abrir o site direto.',
        ];
      case 'mac':
        return [
          'Clique nos três pontos ⋮ no canto superior direito do Chrome',
          'Role até o final e clique em "Mais ferramentas"',
          'Clique em "Criar atalho..."',
          'Dê um nome (opcional), marque "Abrir como janela" se quiser e clique em Criar. O atalho ficará no Dock e no Spotlight.',
        ];
      case 'desktop':
        return [
          'Clique no ícone de menu (três pontos ⋮) no Chrome ou Edge',
          'Vá em "Mais ferramentas" e depois "Criar atalho...", ou use o ícone ⊕/Instalar na barra de endereço se aparecer',
          'O atalho aparecerá na área de trabalho ou no menu Iniciar',
        ];
      default:
        return [
          'Abra o menu do navegador (ícone de três pontos ou similar)',
          'Procure por "Criar atalho", "Adicionar à tela inicial" ou "Instalar"',
          'Siga as instruções na tela',
        ];
    }
  })();

  const platformIcon =
    platform === 'ios' ? (
      <IphoneIcon sx={{ fontSize: 40 }} />
    ) : platform === 'android' ? (
      <AndroidIcon sx={{ fontSize: 40 }} />
    ) : (
      <LaptopIcon sx={{ fontSize: 40 }} />
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
          color: 'white',
        }}
      >
        <InstallDesktopIcon />
        Adicionar atalho ao ambiente de trabalho
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Acesso rápido ao {siteName} direto da sua área de trabalho ou tela inicial.
        </Typography>

        {deferredPrompt && (
          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            onClick={handleInstallClick}
            disabled={installing}
            sx={{
              mb: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              },
            }}
          >
            {installing ? 'Instalando...' : 'Instalar atalho'}
          </Button>
        )}

        {(!deferredPrompt || platform !== 'unknown') && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {platformIcon}
              {platformLabels[platform]}
            </Typography>
            <Stepper orientation="vertical" activeStep={-1}>
              {steps.map((label, index) => (
                <Step key={index} completed={false}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </Box>
                    )}
                  >
                    <Typography variant="body2">{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

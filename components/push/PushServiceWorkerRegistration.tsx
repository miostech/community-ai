'use client';

import { useEffect } from 'react';

const SW_PATH = '/sw.js';

/**
 * Registra o service worker de push ao montar (ex.: no dashboard).
 * Assim o SW já está ativo quando o usuário for em Perfil e ativar notificações.
 */
export function PushServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(SW_PATH).catch(() => {});
  }, []);
  return null;
}

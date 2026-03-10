'use client';

import { useState, useEffect, useCallback } from 'react';

const SW_PATH = '/sw.js';

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as BufferSource;
}

/** True quando o usuário abriu o site pelo atalho na tela inicial (PWA / web app instalado). */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as { standalone?: boolean }).standalone === true) return true; // iOS Safari
  return false;
}

export interface UsePushNotificationsResult {
  pushSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  /** True se abriu pelo atalho do celular (PWA), onde push funciona no iPhone. */
  isPwaStandalone: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mostra a opção de push em qualquer dispositivo com Service Worker + Notification (inclui mobile)
  const pushSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window;

  useEffect(() => {
    if (!pushSupported) return;
    setPermission(Notification.permission);
    navigator.serviceWorker
      .register(SW_PATH)
      .then((reg) => setRegistration(reg))
      .catch(() => setError('Falha ao registrar service worker'));
  }, [pushSupported]);

  useEffect(() => {
    if (!registration?.pushManager) return;
    registration.pushManager.getSubscription().then((sub) => {
      setIsSubscribed(!!sub);
    });
  }, [registration]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!pushSupported || !registration) {
      setError('Push não suportado ou service worker não registrado');
      return false;
    }
    if (!registration.pushManager) {
      setError(
        'No celular: use o Chrome no Android ou, no iPhone, adicione o site à tela inicial (Safari → compartilhar → "Adicionar à tela de início") e abra por ele.'
      );
      return false;
    }
    setError(null);
    setIsLoading(true);
    try {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== 'granted') {
        setError('Permissão de notificação negada');
        setIsLoading(false);
        return false;
      }
      const keyRes = await fetch('/api/push/vapid-public-key');
      if (!keyRes.ok) {
        const data = await keyRes.json().catch(() => ({}));
        setError(data.hint || data.error || 'Chave de push não disponível. Reinicie o servidor após configurar as variáveis VAPID.');
        setIsLoading(false);
        return false;
      }
      const { publicKey } = await keyRes.json();
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const body = {
        endpoint: json.endpoint,
        expirationTime: json.expirationTime ?? null,
        keys: json.keys as { p256dh: string; auth: string },
      };
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        setError(data.error || 'Falha ao ativar notificações');
        setIsLoading(false);
        return false;
      }
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar notificações');
      setIsLoading(false);
      return false;
    }
  }, [pushSupported, registration]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!pushSupported || !registration) return;
    setIsLoading(true);
    setError(null);
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setPermission(Notification.permission);
    } catch {
      setError('Falha ao desativar notificações');
    } finally {
      setIsLoading(false);
    }
  }, [pushSupported, registration]);

  return {
    pushSupported: !!pushSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    isPwaStandalone: isPwaStandalone(),
    subscribe,
    unsubscribe,
  };
}

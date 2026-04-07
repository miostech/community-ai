/**
 * Backup local do telefone (Meu Perfil) para recuperar na próxima visita se o PATCH
 * falhou ou o usuário fechou a aba antes de salvar no servidor.
 * Chaveada por auth_user_id — não substitui o dado do Mongo quando já existe.
 */

const PREFIX = 'dome_phone_draft_v1:';

let draftListeners: Array<() => void> = [];

function notifyDraftChanged(): void {
  draftListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

/** Para o AccountProvider reagir quando o rascunho é salvo no perfil. */
export function subscribePhoneDraftChanged(listener: () => void): () => void {
  draftListeners.push(listener);
  return () => {
    draftListeners = draftListeners.filter((l) => l !== listener);
  };
}

export function savePhoneDraft(
  authUserId: string,
  phone: string,
  phone_country_code: string
): void {
  if (typeof window === 'undefined' || !authUserId) return;
  try {
    const payload = JSON.stringify({
      phone,
      phone_country_code: phone_country_code?.trim() ? phone_country_code.trim() : '+55',
    });
    window.localStorage.setItem(PREFIX + authUserId, payload);
    notifyDraftChanged();
  } catch {
    // quota / private mode
  }
}

export function readPhoneDraft(authUserId: string): { phone: string; phone_country_code: string } | null {
  if (typeof window === 'undefined' || !authUserId) return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + authUserId);
    if (!raw) return null;
    const p = JSON.parse(raw) as { phone?: string; phone_country_code?: string };
    if (!p.phone || typeof p.phone !== 'string' || !p.phone.trim()) return null;
    return {
      phone: p.phone,
      phone_country_code:
        typeof p.phone_country_code === 'string' && p.phone_country_code.trim()
          ? p.phone_country_code.trim()
          : '+55',
    };
  } catch {
    return null;
  }
}

export function clearPhoneDraft(authUserId: string): void {
  if (typeof window === 'undefined' || !authUserId) return;
  try {
    const key = PREFIX + authUserId;
    // Só notifica se havia rascunho; evita loop com AccountProvider (clear → tick → effect → clear).
    if (window.localStorage.getItem(key) === null) return;
    window.localStorage.removeItem(key);
    notifyDraftChanged();
  } catch {
    // ignore
  }
}

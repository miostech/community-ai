/**
 * Usuários em destaque da comunidade (stories) - dados compartilhados
 * entre a lista de stories e a página de perfil.
 */
export interface CommunityUser {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  interactionCount: number;
  instagramProfile?: string;
  tiktokProfile?: string;
  primarySocialLink?: 'instagram' | 'tiktok' | null;
}

export const communityUsers: CommunityUser[] = [
  { id: '1', name: 'Maria Silva', avatar: null, initials: 'MS', interactionCount: 89, instagramProfile: 'mariasilva', tiktokProfile: 'mariasilva', primarySocialLink: 'instagram' },
  { id: '2', name: 'Ana Costa', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', initials: 'AC', interactionCount: 76, instagramProfile: 'anacosta', tiktokProfile: 'anacosta_oficial', primarySocialLink: 'tiktok' },
  { id: '3', name: 'João Santos', avatar: null, initials: 'JS', interactionCount: 65, instagramProfile: 'joaosantos', primarySocialLink: 'instagram' },
  { id: '4', name: 'Pedro Lima', avatar: null, initials: 'PL', interactionCount: 54, tiktokProfile: 'pedrolima', primarySocialLink: 'tiktok' },
  { id: '5', name: 'Carla Mendes', avatar: null, initials: 'CM', interactionCount: 48, instagramProfile: 'carlamendes', primarySocialLink: 'instagram' },
  { id: '6', name: 'Lucas Alves', avatar: null, initials: 'LA', interactionCount: 42 },
].sort((a, b) => b.interactionCount - a.interactionCount);

export function getCommunityUser(id: string): CommunityUser | undefined {
  return communityUsers.find((u) => u.id === id);
}

/** Converte nome para slug na URL (ex: "Maria Silva" → "maria-silva") */
export function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Converte slug da URL de volta para nome (ex: "maria-silva" → "Maria Silva") */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Busca usuário conhecido (stories) pelo slug do nome */
export function getCommunityUserBySlug(slug: string): CommunityUser | undefined {
  const name = slugToName(slug);
  return communityUsers.find((u) => nameToSlug(u.name) === slug || u.name === name);
}

/** Retorna iniciais a partir do nome (ex: "Maria Silva" → "MS") */
export function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getSocialUrl(user: CommunityUser, network: 'instagram' | 'tiktok'): string | null {
  if (network === 'instagram' && user.instagramProfile) {
    return `https://instagram.com/${user.instagramProfile}`;
  }
  if (network === 'tiktok' && user.tiktokProfile) {
    return `https://tiktok.com/@${user.tiktokProfile}`;
  }
  return null;
}

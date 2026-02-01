'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  getCommunityUser,
  getCommunityUserBySlug,
  getSocialUrl,
  nameToSlug,
  slugToName,
  getInitialsFromName,
  type CommunityUser,
} from '@/lib/community-users';
import { useUser } from '@/contexts/UserContext';
import { useAccount } from '@/contexts/AccountContext';
import { usePosts } from '@/contexts/PostsContext';
import { ImageCarousel } from '@/components/community/ImageCarousel';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { CommentsSection } from '@/components/community/CommentsSection';

type PostType = 'idea' | 'script' | 'question' | 'result';

/** Perfil exibido: pode ser usuário conhecido (stories) ou qualquer autor do feed */
type ProfileDisplay = CommunityUser | {
  name: string;
  avatar: string | null;
  initials: string;
  interactionCount: number;
  instagramProfile?: string;
  tiktokProfile?: string;
  youtubeProfile?: string;
};

const postTypeLabels: Record<PostType, string> = {
  idea: 'Ideia',
  script: 'Roteiro',
  question: 'Dúvida',
  result: 'Resultado',
};

function resolveProfileUser(identifier: string, posts: { author: string; avatar: string | null }[]): ProfileDisplay | null {
  if (!identifier?.trim()) return null;
  // Id numérico: usuário dos stories
  if (/^\d+$/.test(identifier)) {
    const user = getCommunityUser(identifier);
    return user ?? null;
  }
  // Slug (ex: maria-silva): pode ser usuário conhecido ou qualquer autor
  const known = getCommunityUserBySlug(identifier);
  if (known) return known;
  const name = slugToName(identifier);
  const authorPosts = posts.filter((p) => p.author === name);
  const firstPost = authorPosts[0];
  return {
    name,
    avatar: firstPost?.avatar ?? null,
    initials: getInitialsFromName(name),
    interactionCount: 0,
    instagramProfile: undefined,
    tiktokProfile: undefined,
    youtubeProfile: undefined,
  };
}

export default function PerfilComunidadePage() {
  const params = useParams();
  const router = useRouter();
  const identifier = (params?.userId as string) ?? '';
  const { user } = useUser();
  const { account, fullName } = useAccount();
  const { posts, updatePost, toggleSavePost } = usePosts();
  const isOwnProfile = Boolean(
    identifier &&
    (fullName ? nameToSlug(fullName) === identifier : user?.name && nameToSlug(user.name) === identifier)
  );
  const resolvedFromList = useMemo(() => resolveProfileUser(identifier, posts), [identifier, posts]);
  const profileUser = useMemo((): ProfileDisplay | null => {
    if (!resolvedFromList) return null;
    if (isOwnProfile) {
      const name = fullName || user?.name || resolvedFromList.name;
      const avatar = account?.avatar_url ?? user?.avatar ?? resolvedFromList.avatar;
      const instagramProfile = (account?.link_instagram ?? user?.instagramProfile)?.trim() || undefined;
      const tiktokProfile = (account?.link_tiktok ?? user?.tiktokProfile)?.trim() || undefined;
      const youtubeProfile = (account?.link_youtube ?? (resolvedFromList && 'youtubeProfile' in resolvedFromList ? resolvedFromList.youtubeProfile : undefined))?.trim() || undefined;
      return {
        name,
        avatar: avatar ?? null,
        initials: getInitialsFromName(name),
        interactionCount: 'interactionCount' in resolvedFromList ? resolvedFromList.interactionCount : 0,
        instagramProfile,
        tiktokProfile,
        youtubeProfile,
      };
    }
    return resolvedFromList;
  }, [resolvedFromList, isOwnProfile, fullName, user?.name, user?.avatar, user?.instagramProfile, user?.tiktokProfile, account?.avatar_url, account?.link_instagram, account?.link_tiktok, account?.link_youtube]);
  const authorNameForPosts = profileUser ? (isOwnProfile ? (fullName || user?.name) ?? profileUser.name : profileUser.name) : '';
  const userPosts = authorNameForPosts ? posts.filter((p) => p.author === authorNameForPosts) : [];
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [seguidoresTooltipOpen, setSeguidoresTooltipOpen] = useState(false);
  type SocialStatsData = {
    totalFollowers: number;
    instagram?: { username: string; followers: number | null } | null;
    tiktok?: { username: string; followers: number | null } | null;
    youtube?: { channelId: string; subscribers: number | null } | null;
  };
  const [socialStats, setSocialStats] = useState<SocialStatsData | null>(null);

  useEffect(() => {
    const instagram = profileUser && 'instagramProfile' in profileUser ? profileUser.instagramProfile?.trim() : undefined;
    const tiktok = profileUser && 'tiktokProfile' in profileUser ? profileUser.tiktokProfile?.trim() : undefined;
    const youtube = profileUser && 'youtubeProfile' in profileUser ? profileUser.youtubeProfile?.trim() : undefined;
    if (!instagram && !tiktok && !youtube) {
      setSocialStats(null);
      return;
    }
    const params = new URLSearchParams();
    if (instagram) params.set('instagram', instagram);
    if (tiktok) params.set('tiktok', tiktok);
    if (youtube) params.set('youtube', youtube);
    fetch(`/api/social-stats?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.totalFollowers === 'number') {
          setSocialStats({
            totalFollowers: data.totalFollowers,
            instagram: data.instagram ?? null,
            tiktok: data.tiktok ?? null,
            youtube: data.youtube ?? null,
          });
        } else {
          setSocialStats(null);
        }
      })
      .catch(() => setSocialStats(null));
  }, [profileUser?.name, profileUser && 'instagramProfile' in profileUser ? profileUser.instagramProfile : undefined, profileUser && 'tiktokProfile' in profileUser ? profileUser.tiktokProfile : undefined, profileUser && 'youtubeProfile' in profileUser ? profileUser.youtubeProfile : undefined]);

  const formatCount = (n: number) =>
    n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k` : n.toLocaleString('pt-BR');
  const handleLike = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      updatePost(postId, {
        liked: !post.liked,
        likes: post.liked ? post.likes - 1 : post.likes + 1,
      });
    }
  };

  const handleDoubleTap = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post && !post.liked) {
      handleLike(postId);
      setShowHeartAnimation(postId);
      setTimeout(() => setShowHeartAnimation(null), 1000);
    }
  };

  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto w-full min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-8">
        <p className="text-gray-600 dark:text-slate-400 mb-4">Perfil não encontrado.</p>
        <Link
          href="/dashboard/comunidade"
          className="text-blue-600 dark:text-blue-400 font-medium"
        >
          Voltar para a comunidade
        </Link>
      </div>
    );
  }

  const instagramUrl = 'instagramProfile' in profileUser && profileUser.instagramProfile
    ? getSocialUrl(profileUser as CommunityUser, 'instagram')
    : null;
  const tiktokUrl = 'tiktokProfile' in profileUser && profileUser.tiktokProfile
    ? getSocialUrl(profileUser as CommunityUser, 'tiktok')
    : null;
  const youtubeUrl = 'youtubeProfile' in profileUser && profileUser.youtubeProfile
    ? `https://www.youtube.com/@${profileUser.youtubeProfile.replace(/^@/, '')}`
    : null;

  /** Borda colorida (destaque) só para quem está nos stories */
  const isFromStories = 'id' in profileUser;

  /** Avatar: só a foto salva na conta (upload manual ou "Usar foto do Instagram" em Meu perfil) */
  const displayAvatar = profileUser.avatar ?? null;

  return (
    <div className="max-w-2xl mx-auto w-full pb-24 sm:pb-8 bg-white dark:bg-black min-h-screen">
      {/* Header fixo - estilo Instagram */}
      <div className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-neutral-800 shadow-sm backdrop-blur-lg bg-white/95 dark:bg-black/95">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center text-gray-700 dark:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100 truncate flex-1">
            Perfil
          </h1>
        </div>
      </div>

      {/* Perfil - estilo Instagram */}
      <div className="px-4 py-6 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Avatar: borda colorida só para quem está nos stories */}
          <div className="flex justify-center sm:justify-start">
            {isFromStories ? (
              <div className="rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-1">
                <div className="rounded-full bg-white dark:bg-black p-1">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={profileUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-3xl sm:text-4xl">
                        {profileUser.initials}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-slate-600">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={profileUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 dark:text-slate-300 font-bold text-3xl sm:text-4xl">
                    {profileUser.initials}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-1">
              {profileUser.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Membro da comunidade
            </p>

            {/* Stats estilo Instagram: publicações, interações e seguidores (redes) */}
            <div className="flex justify-center sm:justify-start gap-6 mb-4 flex-wrap">
              <div>
                <span className="block font-semibold text-gray-900 dark:text-slate-100">
                  {userPosts.length}
                </span>
                <span className="text-sm text-gray-500 dark:text-slate-400">publicações</span>
              </div>
              <div>
                <span className="block font-semibold text-gray-900 dark:text-slate-100">
                  {profileUser.interactionCount}
                </span>
                <span className="text-sm text-gray-500 dark:text-slate-400">interações</span>
              </div>
              {socialStats !== null && (
                <div
                  className="relative inline-flex flex-col items-center sm:items-start group"
                  onMouseEnter={() => setSeguidoresTooltipOpen(true)}
                  onMouseLeave={() => setSeguidoresTooltipOpen(false)}
                >
                  <div className="flex items-center gap-1">
                    <span className="block font-semibold text-gray-900 dark:text-slate-100">
                      {formatCount(socialStats.totalFollowers)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSeguidoresTooltipOpen((v) => !v)}
                      className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 cursor-help transition-colors flex-shrink-0 touch-manipulation"
                      aria-label="Detalhes dos seguidores"
                      aria-expanded={seguidoresTooltipOpen}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-slate-400">seguidores</span>
                  {/* Tooltip: soma das redes + detalhe por rede + atualização 24h */}
                  <div
                    role="tooltip"
                    className={`absolute left-0 bottom-full mb-1 sm:left-0 sm:bottom-full sm:mb-1 w-56 px-3 py-2.5 rounded-lg bg-gray-900 dark:bg-slate-800 text-white text-xs shadow-xl transition-all duration-150 z-50 ${seguidoresTooltipOpen ? 'opacity-100 visible' : 'opacity-0 invisible sm:group-hover:opacity-100 sm:group-hover:visible'}`}
                  >
                    <p className="font-medium text-slate-200 dark:text-slate-200 mb-2">Soma das redes cadastradas</p>
                    <ul className="space-y-1 text-slate-300 dark:text-slate-300">
                      {socialStats.instagram != null && (
                        <li>Instagram: {socialStats.instagram.followers != null ? formatCount(socialStats.instagram.followers) + ' seguidores' : '—'}</li>
                      )}
                      {socialStats.tiktok != null && (
                        <li>TikTok: {socialStats.tiktok.followers != null ? formatCount(socialStats.tiktok.followers) + ' seguidores' : '—'}</li>
                      )}
                      {socialStats.youtube != null && (
                        <li>YouTube: {socialStats.youtube.subscribers != null ? formatCount(socialStats.youtube.subscribers) + ' inscritos' : '—'}</li>
                      )}
                    </ul>
                    <p className="mt-2 pt-2 border-t border-slate-600 text-slate-400 dark:text-slate-400">Dados atualizados a cada 24h</p>
                  </div>
                </div>
              )}
            </div>

            {/* Links para redes sociais (só aparecem se o perfil tiver redes cadastradas) */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {(instagramUrl || tiktokUrl || youtubeUrl) ? (
                <>
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-slate-100 text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  TikTok
                </a>
              )}
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </a>
              )}
                </>
              ) : (
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  Redes sociais não informadas
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feed - publicações da pessoa na comunidade */}
      <div className="border-b border-gray-200 dark:border-neutral-800">
        <h3 className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 border-b border-gray-100 dark:border-neutral-800">
          Publicações na comunidade
        </h3>
      </div>

      {userPosts.length === 0 ? (
        <div className="p-8 text-center border-b border-gray-200 dark:border-neutral-800">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-slate-300 font-medium mb-1">Nenhuma publicação ainda</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            As publicações de {profileUser.name.split(' ')[0]} na comunidade aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-neutral-800">
          {userPosts.map((post) => (
            <article key={post.id} className="bg-white dark:bg-black">
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    {typeof post.avatar === 'string' && post.avatar.length > 2 ? (
                      <img
                        src={post.avatar}
                        alt={post.author}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-slate-600 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {typeof post.avatar === 'string' ? post.avatar : post.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{post.author}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{post.timeAgo}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full flex-shrink-0">
                    {postTypeLabels[post.type]}
                  </span>
                </div>

                <div className="text-sm text-gray-900 dark:text-slate-100 whitespace-pre-line break-words mb-3 leading-relaxed">
                  {post.content}
                </div>

                {post.imageUrls && post.imageUrls.length > 0 && (
                  <div
                    className="mb-3 -mx-3 sm:-mx-4 relative"
                    onDoubleClick={() => handleDoubleTap(post.id)}
                  >
                    <ImageCarousel images={post.imageUrls} />
                    {showHeartAnimation === post.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg className="w-24 h-24 text-white drop-shadow-2xl animate-ping" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                {!post.imageUrls && post.imageUrl && (
                  <div
                    className="mb-3 -mx-3 sm:-mx-4 relative select-none"
                    onDoubleClick={() => handleDoubleTap(post.id)}
                  >
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full aspect-square object-cover bg-gray-100 dark:bg-slate-800"
                      loading="lazy"
                    />
                    {showHeartAnimation === post.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-24 h-24 text-white drop-shadow-2xl animate-ping" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                {post.videoUrl && (
                  <div className="mb-3">
                    <VideoEmbed url={post.videoUrl} />
                  </div>
                )}

                <div className="flex items-center space-x-4 sm:space-x-6 pt-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1.5 transition-all active:scale-95 ${post.liked ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-slate-100'}`}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={post.liked ? 0 : 1.5} viewBox="0 0 24 24">
                      {post.liked ? (
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      )}
                    </svg>
                    <span className="text-sm sm:text-base font-semibold">{post.likes}</span>
                  </button>
                  <button
                    onClick={() => setActiveCommentsPostId(post.id)}
                    className="flex items-center space-x-1.5 text-gray-900 dark:text-slate-100 active:scale-95 transition-all"
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <span className="text-sm sm:text-base font-semibold">{post.comments}</span>
                  </button>
                  <button
                    onClick={() => toggleSavePost(post.id)}
                    className={`flex items-center space-x-1.5 active:scale-95 transition-all ml-auto ${post.saved ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-slate-100'}`}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill={post.saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={post.saved ? 0 : 1.5} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeCommentsPostId && (
        <CommentsSection
          postId={activeCommentsPostId}
          isOpen={!!activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
        />
      )}
    </div>
  );
}

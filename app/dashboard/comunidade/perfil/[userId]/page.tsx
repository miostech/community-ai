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
import { usePosts, type Post } from '@/contexts/PostsContext';
import { ImageCarousel } from '@/components/community/ImageCarousel';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { CommentsSection } from '@/components/community/CommentsSection';

// MUI imports
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
  Skeleton,
  Stack,
  Divider,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Info as InfoIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  MusicNote as TikTokIcon,
  PhotoLibrary as PhotoLibraryIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

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

const postTypeColors: Record<PostType, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  idea: 'info',
  script: 'secondary',
  question: 'warning',
  result: 'success',
};

/** Mapeia categoria da API para tipo do perfil */
const categoryToType: Record<string, PostType> = {
  ideia: 'idea',
  resultado: 'result',
  duvida: 'question',
  roteiro: 'script',
  geral: 'idea',
};

/** Tipo unificado para posts exibidos no perfil */
type ProfilePostFromApi = {
  id: string;
  type: PostType;
  author: string;
  avatar: string | null;
  content: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  videoUrl?: string;
  linkInstagramPost?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked?: boolean;
  saved?: boolean;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'agora';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

/** Identificador é um ID de conta (MongoDB ObjectId, 24 hex) */
function isAccountId(identifier: string): boolean {
  return /^[a-f0-9]{24}$/i.test(identifier);
}

function resolveProfileUser(identifier: string, posts: Post[]): ProfileDisplay | null {
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
  const authorPosts = posts.filter((p) =>
    typeof p.author === 'object' ? p.author.name === name : p.author === name
  );
  const firstPost = authorPosts[0];
  const authorAvatar = firstPost?.author && typeof firstPost.author === 'object' ? firstPost.author.avatar_url : null;
  return {
    name,
    avatar: authorAvatar ?? null,
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
  const { posts, updatePost, toggleSave } = usePosts();
  const isOwnProfile = Boolean(
    identifier &&
    (
      (fullName ? nameToSlug(fullName) === identifier : user?.name && nameToSlug(user.name) === identifier) ||
      (account?.id && identifier === account.id)
    )
  );
  const resolvedFromList = useMemo(() => resolveProfileUser(identifier, posts), [identifier, posts]);

  // Posts do próprio perfil: buscar da API (postagens reais da comunidade)
  const [profilePostsFromApi, setProfilePostsFromApi] = useState<ProfilePostFromApi[]>([]);
  const [profilePostsLoading, setProfilePostsLoading] = useState(false);

  // Perfil de outro usuário acessado por ID (nome, avatar, redes e posts da API)
  const [otherProfileData, setOtherProfileData] = useState<{
    profileUser: ProfileDisplay;
    posts: ProfilePostFromApi[];
  } | null>(null);
  const [otherProfileLoading, setOtherProfileLoading] = useState(false);

  useEffect(() => {
    if (!isOwnProfile || !account?.id) {
      setProfilePostsFromApi([]);
      return;
    }
    let cancelled = false;
    setProfilePostsLoading(true);
    fetch(`/api/posts?author_id=${encodeURIComponent(account.id)}&limit=50`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.posts) return;
        const mapped: ProfilePostFromApi[] = data.posts.map((p: {
          id: string;
          author: { name?: string; avatar_url?: string | null };
          content: string;
          images?: string[];
          video_url?: string;
          link_instagram_post?: string;
          category: string;
          likes_count: number;
          comments_count: number;
          created_at: string;
        }) => ({
          id: p.id,
          type: categoryToType[p.category] ?? 'idea',
          author: p.author?.name ?? 'Eu',
          avatar: p.author?.avatar_url ?? null,
          content: p.content,
          imageUrl: p.images?.[0] ?? null,
          imageUrls: p.images?.length ? p.images : undefined,
          videoUrl: p.video_url ?? undefined,
          linkInstagramPost: p.link_instagram_post ?? undefined,
          likes: p.likes_count ?? 0,
          comments: p.comments_count ?? 0,
          timeAgo: formatTimeAgo(p.created_at),
          liked: false,
          saved: false,
        }));
        setProfilePostsFromApi(mapped);
      })
      .catch(() => { if (!cancelled) setProfilePostsFromApi([]); })
      .finally(() => { if (!cancelled) setProfilePostsLoading(false); });
    return () => { cancelled = true; };
  }, [isOwnProfile, account?.id]);

  // Carregar perfil e posts de outro usuário quando o identifier é o ID da conta
  useEffect(() => {
    if (!identifier || !isAccountId(identifier) || isOwnProfile) {
      setOtherProfileData(null);
      return;
    }
    let cancelled = false;
    setOtherProfileLoading(true);
    setOtherProfileData(null);

    const mapApiPostToProfilePost = (p: {
      id: string;
      author: { name?: string; avatar_url?: string | null };
      content: string;
      images?: string[];
      video_url?: string;
      link_instagram_post?: string;
      category: string;
      likes_count: number;
      comments_count: number;
      created_at: string;
    }): ProfilePostFromApi => ({
      id: p.id,
      type: categoryToType[p.category] ?? 'idea',
      author: p.author?.name ?? 'Membro',
      avatar: p.author?.avatar_url ?? null,
      content: p.content,
      imageUrl: p.images?.[0] ?? null,
      imageUrls: p.images?.length ? p.images : undefined,
      videoUrl: p.video_url ?? undefined,
      linkInstagramPost: p.link_instagram_post ?? undefined,
      likes: p.likes_count ?? 0,
      comments: p.comments_count ?? 0,
      timeAgo: formatTimeAgo(p.created_at),
      liked: false,
      saved: false,
    });

    Promise.all([
      fetch(`/api/accounts/public/${encodeURIComponent(identifier)}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/posts?author_id=${encodeURIComponent(identifier)}&limit=50`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([profileRes, postsRes]) => {
        if (cancelled) return;
        const profile = profileRes?.profile;
        const posts = postsRes?.posts ?? [];
        const name = profile?.name?.trim() || 'Membro da comunidade';
        const profileUser: ProfileDisplay = {
          name,
          avatar: profile?.avatar_url ?? null,
          initials: getInitialsFromName(name),
          interactionCount: 0,
          instagramProfile: profile?.link_instagram?.trim() || undefined,
          tiktokProfile: profile?.link_tiktok?.trim() || undefined,
          youtubeProfile: profile?.link_youtube?.trim() || undefined,
        };
        const mappedPosts = posts.map(mapApiPostToProfilePost);
        setOtherProfileData({ profileUser, posts: mappedPosts });
      })
      .catch(() => { if (!cancelled) setOtherProfileData(null); })
      .finally(() => { if (!cancelled) setOtherProfileLoading(false); });

    return () => { cancelled = true; };
  }, [identifier, isOwnProfile]);

  const isOtherUserById = isAccountId(identifier) && !isOwnProfile;
  const profileUser = useMemo((): ProfileDisplay | null => {
    if (isOtherUserById) {
      if (otherProfileData) return otherProfileData.profileUser;
      if (otherProfileLoading) return resolvedFromList;
      return resolvedFromList;
    }
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
  }, [isOtherUserById, otherProfileData, otherProfileLoading, resolvedFromList, isOwnProfile, fullName, user?.name, user?.avatar, user?.instagramProfile, user?.tiktokProfile, account?.avatar_url, account?.link_instagram, account?.link_tiktok, account?.link_youtube]);

  const authorNameForPosts = profileUser ? (isOwnProfile ? (fullName || user?.name) ?? profileUser.name : profileUser.name) : '';
  // Posts para exibir no perfil (todos do tipo ProfilePostFromApi para consistência)
  const userPosts: ProfilePostFromApi[] = isOwnProfile
    ? profilePostsFromApi
    : isOtherUserById && otherProfileData
      ? otherProfileData.posts
      : []; // Posts de outros usuários são carregados via API quando acessados por ID
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
    if (isOwnProfile) {
      const post = profilePostsFromApi.find((p) => p.id === postId);
      if (post) {
        setProfilePostsFromApi((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
          )
        );
        return;
      }
    }
    if (isOtherUserById && otherProfileData) {
      const post = otherProfileData.posts.find((p) => p.id === postId);
      if (post) {
        setOtherProfileData((prev) =>
          prev
            ? {
              ...prev,
              posts: prev.posts.map((p) =>
                p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
              ),
            }
            : prev
        );
        return;
      }
    }
    const post = posts.find((p) => p.id === postId);
    if (post) {
      updatePost(postId, {
        liked: !post.liked,
        likes_count: post.liked ? post.likes_count - 1 : post.likes_count + 1,
      });
    }
  };

  const handleDoubleTap = (postId: string) => {
    const list = isOwnProfile ? profilePostsFromApi : (isOtherUserById && otherProfileData ? otherProfileData.posts : posts);
    const post = list.find((p) => p.id === postId);
    if (post && !post.liked) {
      handleLike(postId);
      setShowHeartAnimation(postId);
      setTimeout(() => setShowHeartAnimation(null), 1000);
    }
  };

  const handleToggleSave = (postId: string) => {
    if (isOwnProfile) {
      setProfilePostsFromApi((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p))
      );
      return;
    }
    if (isOtherUserById && otherProfileData) {
      setOtherProfileData((prev) =>
        prev
          ? { ...prev, posts: prev.posts.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)) }
          : prev
      );
      return;
    }
    toggleSave(postId);
  };

  // Loading state
  if (isOtherUserById && otherProfileLoading) {
    return (
      <Box
        sx={{
          maxWidth: 672,
          mx: 'auto',
          minHeight: '100vh',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="text.secondary">Carregando perfil...</Typography>
      </Box>
    );
  }

  // Not found state
  if (!profileUser) {
    return (
      <Box
        sx={{
          maxWidth: 672,
          mx: 'auto',
          minHeight: '100vh',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Perfil não encontrado.
        </Typography>
        <Button
          component={Link}
          href="/dashboard/comunidade"
          color="primary"
        >
          Voltar para a comunidade
        </Button>
      </Box>
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
    <Box
      sx={{
        maxWidth: 672,
        mx: 'auto',
        pb: { xs: 12, sm: 4 },
        bgcolor: 'background.paper',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* Header fixo */}
      <AppBar sx={{ width: { xs: '100%', md: 'calc(100% - 256px)' } }}>
        <Toolbar>
          <IconButton
            onClick={() => router.back()}
            size="small"
            sx={{ color: 'text.primary', mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Perfil
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Spacer para o header fixo */}
      <Box sx={{ height: 67 }} />

      {/* Perfil section */}
      <Box sx={{ px: 2, py: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
        >
          {/* Avatar */}
          <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            {isFromStories ? (
              <Box
                sx={{
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)',
                  p: 0.5,
                }}
              >
                <Box
                  sx={{
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    p: 0.5,
                  }}
                >
                  <Avatar
                    src={displayAvatar || undefined}
                    sx={{
                      width: { xs: 96, sm: 112 },
                      height: { xs: 96, sm: 112 },
                      background: 'linear-gradient(135deg, #60a5fa, #a855f7)',
                      fontSize: { xs: 32, sm: 40 },
                      fontWeight: 'bold',
                    }}
                  >
                    {profileUser.initials}
                  </Avatar>
                </Box>
              </Box>
            ) : (
              <Avatar
                src={displayAvatar || undefined}
                sx={{
                  width: { xs: 96, sm: 112 },
                  height: { xs: 96, sm: 112 },
                  bgcolor: 'grey.300',
                  border: 2,
                  borderColor: 'divider',
                  fontSize: { xs: 32, sm: 40 },
                  fontWeight: 'bold',
                  color: 'text.secondary',
                }}
              >
                {profileUser.initials}
              </Avatar>
            )}
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
              {profileUser.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Membro da comunidade
            </Typography>

            {/* Stats */}
            <Stack
              direction="row"
              spacing={3}
              sx={{
                justifyContent: { xs: 'center', sm: 'flex-start' },
                mb: 2,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {userPosts.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  publicações
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {profileUser.interactionCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  interações
                </Typography>
              </Box>
              {socialStats !== null && (
                <Tooltip
                  open={seguidoresTooltipOpen}
                  onClose={() => setSeguidoresTooltipOpen(false)}
                  onOpen={() => setSeguidoresTooltipOpen(true)}
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" fontWeight={500} display="block" sx={{ mb: 1 }}>
                        Soma das redes cadastradas
                      </Typography>
                      <Stack spacing={0.5}>
                        {socialStats.instagram != null && (
                          <Typography variant="caption">
                            Instagram: {socialStats.instagram.followers != null ? formatCount(socialStats.instagram.followers) + ' seguidores' : '—'}
                          </Typography>
                        )}
                        {socialStats.tiktok != null && (
                          <Typography variant="caption">
                            TikTok: {socialStats.tiktok.followers != null ? formatCount(socialStats.tiktok.followers) + ' seguidores' : '—'}
                          </Typography>
                        )}
                        {socialStats.youtube != null && (
                          <Typography variant="caption">
                            YouTube: {socialStats.youtube.subscribers != null ? formatCount(socialStats.youtube.subscribers) + ' inscritos' : '—'}
                          </Typography>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider', display: 'block' }}>
                        Dados atualizados a cada 24h
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box
                    sx={{
                      textAlign: { xs: 'center', sm: 'left' },
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: { xs: 'center', sm: 'flex-start' },
                    }}
                    onClick={() => setSeguidoresTooltipOpen((v) => !v)}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {formatCount(socialStats.totalFollowers)}
                      </Typography>
                      <InfoIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      seguidores
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Stack>

            {/* Social links */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                justifyContent: { xs: 'center', sm: 'flex-start' },
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {(instagramUrl || tiktokUrl || youtubeUrl) ? (
                <>
                  {instagramUrl && (
                    <Button
                      component="a"
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="small"
                      startIcon={<InstagramIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)',
                          opacity: 0.9,
                        },
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Instagram
                    </Button>
                  )}
                  {tiktokUrl && (
                    <Button
                      component="a"
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="small"
                      startIcon={<TikTokIcon />}
                      sx={{
                        bgcolor: 'grey.900',
                        color: 'common.white',
                        '&:hover': {
                          bgcolor: 'grey.800',
                        },
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                    >
                      TikTok
                    </Button>
                  )}
                  {youtubeUrl && (
                    <Button
                      component="a"
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="small"
                      startIcon={<YouTubeIcon />}
                      sx={{
                        bgcolor: 'error.main',
                        '&:hover': {
                          bgcolor: 'error.dark',
                        },
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                    >
                      YouTube
                    </Button>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Redes sociais não informadas
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Posts section header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          color="text.secondary"
          sx={{ px: 2, py: 1.5 }}
        >
          Publicações na comunidade
        </Typography>
      </Box>

      {/* Posts */}
      {profilePostsLoading && isOwnProfile ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography color="text.secondary" fontWeight={500}>
            Carregando publicações...
          </Typography>
        </Box>
      ) : userPosts.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <PhotoLibraryIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          </Box>
          <Typography fontWeight={500} sx={{ mb: 0.5 }}>
            Nenhuma publicação ainda
          </Typography>
          <Typography variant="body2" color="text.secondary">
            As publicações de {profileUser.name.split(' ')[0]} na comunidade aparecerão aqui.
          </Typography>
        </Box>
      ) : (
        <Box>
          {userPosts.map((post, index) => (
            <Paper
              key={post.id}
              elevation={0}
              sx={{
                borderBottom: index < userPosts.length - 1 ? 1 : 0,
                borderColor: 'divider',
                borderRadius: 0,
              }}
            >
              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                {/* Post header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1.5 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                    <Avatar
                      src={typeof post.avatar === 'string' && post.avatar.length > 2 ? post.avatar : undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #60a5fa, #a855f7)',
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {typeof post.avatar === 'string' ? post.avatar : post.author.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {post.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {post.timeAgo}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={postTypeLabels[post.type]}
                    size="small"
                    color={postTypeColors[post.type]}
                    sx={{ fontSize: 10, height: 22 }}
                  />
                </Stack>

                {/* Content */}
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                    mb: 1.5,
                    lineHeight: 1.6,
                  }}
                >
                  {post.content}
                </Typography>

                {/* Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                  <Box
                    sx={{
                      mb: 1.5,
                      mx: { xs: -1.5, sm: -2 },
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onDoubleClick={() => handleDoubleTap(post.id)}
                  >
                    <ImageCarousel images={post.imageUrls} />
                    {showHeartAnimation === post.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          zIndex: 10,
                        }}
                      >
                        <FavoriteIcon
                          sx={{
                            fontSize: 96,
                            color: 'common.white',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                            animation: 'ping 1s ease-out forwards',
                            '@keyframes ping': {
                              '0%': { transform: 'scale(1)', opacity: 1 },
                              '100%': { transform: 'scale(1.5)', opacity: 0 },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}

                {/* Single image fallback */}
                {!post.imageUrls && post.imageUrl && (
                  <Box
                    sx={{
                      mb: 1.5,
                      mx: { xs: -1.5, sm: -2 },
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onDoubleClick={() => handleDoubleTap(post.id)}
                  >
                    <Box
                      component="img"
                      src={post.imageUrl}
                      alt="Post"
                      sx={{
                        width: '100%',
                        aspectRatio: '4/5',
                        maxHeight: 600,
                        objectFit: 'cover',
                        bgcolor: 'action.hover',
                      }}
                      loading="lazy"
                    />
                    {showHeartAnimation === post.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <FavoriteIcon
                          sx={{
                            fontSize: 96,
                            color: 'common.white',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                            animation: 'ping 1s ease-out forwards',
                            '@keyframes ping': {
                              '0%': { transform: 'scale(1)', opacity: 1 },
                              '100%': { transform: 'scale(1.5)', opacity: 0 },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}

                {/* Video */}
                {post.videoUrl && (
                  <Box sx={{ mb: 1.5, mx: { xs: -1.5, sm: -2 } }}>
                    <Box
                      component="video"
                      src={post.videoUrl}
                      controls
                      sx={{
                        width: '100%',
                        aspectRatio: '4/5',
                        maxHeight: 600,
                        objectFit: 'contain',
                        bgcolor: 'black',
                      }}
                    />
                  </Box>
                )}

                {/* Link social */}
                {post.linkInstagramPost && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography
                      component="a"
                      href={post.linkInstagramPost}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      color="primary"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                      {post.linkInstagramPost.includes('instagram.com')
                        ? 'Ver post no Instagram'
                        : post.linkInstagramPost.includes('tiktok.com')
                          ? 'Ver post no TikTok'
                          : post.linkInstagramPost.includes('x.com') || post.linkInstagramPost.includes('twitter.com')
                            ? 'Ver post no X'
                            : 'Ver post original'}
                    </Typography>
                  </Box>
                )}

                {/* Actions */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={{ xs: 2, sm: 3 }}
                  sx={{ pt: 1.5 }}
                >
                  <IconButton
                    onClick={() => handleLike(post.id)}
                    size="small"
                    sx={{
                      color: post.liked ? 'error.main' : 'text.primary',
                      '&:active': { transform: 'scale(0.95)' },
                    }}
                  >
                    {post.liked ? (
                      <FavoriteIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    )}
                  </IconButton>
                  <Typography variant="body2" fontWeight={600} sx={{ ml: -1 }}>
                    {post.likes}
                  </Typography>

                  <IconButton
                    onClick={() => setActiveCommentsPostId(post.id)}
                    size="small"
                    sx={{
                      color: 'text.primary',
                      '&:active': { transform: 'scale(0.95)' },
                    }}
                  >
                    <CommentIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                  </IconButton>
                  <Typography variant="body2" fontWeight={600} sx={{ ml: -1 }}>
                    {post.comments}
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  <IconButton
                    onClick={() => handleToggleSave(post.id)}
                    size="small"
                    sx={{
                      color: post.saved ? 'primary.main' : 'text.primary',
                      '&:active': { transform: 'scale(0.95)' },
                    }}
                  >
                    {post.saved ? (
                      <BookmarkIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    ) : (
                      <BookmarkBorderIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    )}
                  </IconButton>
                </Stack>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Comments modal */}
      {activeCommentsPostId && (
        <CommentsSection
          postId={activeCommentsPostId}
          isOpen={!!activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
        />
      )}
    </Box>
  );
}

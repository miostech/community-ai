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
import { useStories } from '@/contexts/StoriesContext';
import { ImageCarousel } from '@/components/community/ImageCarousel';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { CommentsSection } from '@/components/community/CommentsSection';
import { NotificationsButtonMui } from '@/components/community/NotificationsButtonMui';
import { StoryViewer, type StoryItem } from '@/components/community/StoryViewer';
import { sortCourseIds, getCourseLabel, CURSOS, courseIdsIncludeCourse } from '@/lib/courses';
import { useCourses } from '@/contexts/CoursesContext';

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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  TextsmsOutlined as CommentIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  InfoOutline as InfoIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  MusicNote as TikTokIcon,
  PhotoLibrary as PhotoLibraryIcon,
  OpenInNew as OpenInNewIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
} from '@mui/icons-material';

type PostType = 'idea' | 'script' | 'question' | 'result' | 'general';

/** Perfil exibido: pode ser usuário conhecido (stories) ou qualquer autor do feed */
type ProfileDisplay = CommunityUser | {
  name: string;
  avatar: string | null;
  initials: string;
  interactionCount: number;
  instagramProfile?: string;
  tiktokProfile?: string;
  youtubeProfile?: string;
  created_at?: string | null;
  courseIds?: string[];
};


/** TESTE cursos no bio: descomentar setOwnCourseIds(TEST_MOCK_COURSE_IDS) e comentar o bloco real para visualizar mock. */
// const TEST_MOCK_COURSE_IDS: string[] = ['AQDrLac', 'YIUXqzV', '96dk0GP'];

const postTypeLabels: Record<PostType, string> = {
  idea: 'Ideia',
  script: 'Roteiro',
  question: 'Dúvida',
  result: 'Resultado',
  general: 'Geral',
};

const postTypeColors: Record<PostType, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  idea: 'info',
  script: 'secondary',
  question: 'warning',
  result: 'success',
  general: 'default',
};

/** Mapeia categoria da API para tipo do perfil */
const categoryToType: Record<string, PostType> = {
  ideia: 'idea',
  resultado: 'result',
  duvida: 'question',
  roteiro: 'script',
  geral: 'general',
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
  const { users: storyUsers } = useStories();
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

  // Cursos do próprio perfil — vêm do CoursesContext (já buscados uma vez, com cache de 1h)
  const { courseIds: ownCourseIds } = useCourses();

  // InteractionCount e created_at do próprio perfil
  const [ownInteractionCount, setOwnInteractionCount] = useState<number>(0);
  const [ownCreatedAt, setOwnCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwnProfile || !account?.id) {
      setOwnInteractionCount(0);
      setOwnCreatedAt(null);
      return;
    }
    // skipCourses=true → rota não chama Kiwify (cursos já vêm do CoursesContext)
    fetch(`/api/accounts/public/${encodeURIComponent(account.id)}?skipCourses=true`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile?.interactionCount != null) {
          setOwnInteractionCount(data.profile.interactionCount);
        }
        if (data?.profile?.created_at) {
          setOwnCreatedAt(data.profile.created_at);
        }
      })
      .catch(() => { });
  }, [isOwnProfile, account?.id]);

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
          interactionCount: profile?.interactionCount ?? 0,
          instagramProfile: profile?.link_instagram?.trim() || undefined,
          tiktokProfile: profile?.link_tiktok?.trim() || undefined,
          youtubeProfile: profile?.link_youtube?.trim() || undefined,
          created_at: profile?.created_at ?? null,
          courseIds: Array.isArray(profile?.courseIds) ? profile.courseIds : undefined,
        };
        const mappedPosts = posts.map(mapApiPostToProfilePost);
        setOtherProfileData({ profileUser, posts: mappedPosts });
      })
      .catch(() => { if (!cancelled) setOtherProfileData(null); })
      .finally(() => { if (!cancelled) setOtherProfileLoading(false); });

    return () => { cancelled = true; };
  }, [identifier, isOwnProfile]);

  const isOtherUserById = isAccountId(identifier) && !isOwnProfile;
  /** ID da conta do perfil (para buscar stories temporários). No próprio perfil = account.id; em outro por ID = identifier. */
  const profileAccountId = isOwnProfile ? (account?.id ?? null) : (isOtherUserById && isAccountId(identifier) ? identifier : null);
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
        interactionCount: ownInteractionCount,
        instagramProfile,
        tiktokProfile,
        youtubeProfile,
        created_at: ownCreatedAt,
        courseIds: ownCourseIds.length > 0 ? ownCourseIds : undefined,
      };
    }
    return resolvedFromList;
  }, [isOtherUserById, otherProfileData, otherProfileLoading, resolvedFromList, isOwnProfile, fullName, user?.name, user?.avatar, user?.instagramProfile, user?.tiktokProfile, account?.avatar_url, account?.link_instagram, account?.link_tiktok, account?.link_youtube, ownInteractionCount, ownCreatedAt, ownCourseIds]);

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

  // Stories temporários (24h) — só no perfil público
  const [profileStories, setProfileStories] = useState<StoryItem[]>([]);
  const [profileStoriesLoading, setProfileStoriesLoading] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  /** Quando o usuário viu todos os stories deste perfil (para esconder a borda colorida). */
  const [lastStoriesSeenAt, setLastStoriesSeenAt] = useState<number | null>(null);
  const STORIES_SEEN_KEY = 'stories_seen_';
  const [addStoryOpen, setAddStoryOpen] = useState(false);
  const [addStoryFile, setAddStoryFile] = useState<File | null>(null);
  const [addStoryUploading, setAddStoryUploading] = useState(false);

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

  // Buscar stories temporários do perfil (quando é perfil por account id)
  useEffect(() => {
    if (!profileAccountId) {
      setProfileStories([]);
      return;
    }
    let cancelled = false;
    setProfileStoriesLoading(true);
    fetch(`/api/accounts/${profileAccountId}/stories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: StoryItem[]) => {
        if (!cancelled) setProfileStories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setProfileStories([]);
      })
      .finally(() => {
        if (!cancelled) setProfileStoriesLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileAccountId]);

  // Sincronizar "última vez que viu todos os stories" do localStorage (por perfil)
  useEffect(() => {
    if (!profileAccountId) {
      setLastStoriesSeenAt(null);
      return;
    }
    try {
      const v = localStorage.getItem(STORIES_SEEN_KEY + profileAccountId);
      setLastStoriesSeenAt(v ? Number(v) : null);
    } catch {
      setLastStoriesSeenAt(null);
    }
  }, [profileAccountId]);

  /** Borda colorida só aparece se houver story novo que o usuário ainda não viu. */
  const hasUnseenStories =
    profileStories.length > 0 &&
    (!lastStoriesSeenAt ||
      Math.max(...profileStories.map((s) => new Date(s.created_at).getTime())) > lastStoriesSeenAt);

  /** Índice do primeiro story não visto (para abrir o viewer já nos novos). */
  const initialStoryIndex =
    profileStories.length === 0
      ? 0
      : lastStoriesSeenAt == null
        ? 0
        : (() => {
            const i = profileStories.findIndex((s) => new Date(s.created_at).getTime() > lastStoriesSeenAt!);
            return i === -1 ? 0 : i;
          })();

  const handleAddStorySubmit = async () => {
    if (!addStoryFile) return;
    setAddStoryUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', addStoryFile);
      const res = await fetch('/api/stories', { method: 'POST', body: formData });
      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await res.json() : { error: await res.text() || 'Erro ao publicar' };
        throw new Error(typeof data?.error === 'string' ? data.error : 'Erro ao publicar story');
      }
      setAddStoryOpen(false);
      setAddStoryFile(null);
      if (profileAccountId) {
        const listRes = await fetch(`/api/accounts/${profileAccountId}/stories`);
        if (listRes.ok) {
          const list = await listRes.json();
          setProfileStories(Array.isArray(list) ? list : []);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      const mensagem = msg && !/expected pattern|fetch failed|network/i.test(msg)
        ? `${msg} Tente novamente.`
        : 'Algo deu errado ao publicar. Tente novamente.';
      alert(mensagem);
    } finally {
      setAddStoryUploading(false);
    }
  };

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

  /** ID do perfil atual para comparar com a lista de stories (URL quando é conta real, ou profileUser.id quando é lista estática) */
  const profileIdForStories = isOtherUserById ? identifier : ('id' in profileUser ? (profileUser as CommunityUser).id : null);
  /** Borda/badge: só para quem está na lista de stories (API) */
  const isFromStories = profileIdForStories != null && storyUsers.some((u) => u.id === profileIdForStories);
  /** Destaque (borda dourada + troféu) só para o primeiro da lista de stories */
  const isFeaturedStory = isFromStories && storyUsers[0]?.id === profileIdForStories;

  /** Posição no ranking da comunidade (1-based; 0 se não estiver na lista) */
  const idForRanking = isOtherUserById ? identifier : isOwnProfile ? account?.id ?? null : 'id' in profileUser ? (profileUser as CommunityUser).id : null;
  const rankingPosition =
    storyUsers.length > 0
      ? idForRanking
        ? (() => {
            const idx = storyUsers.findIndex((u) => u.id === idForRanking);
            return idx >= 0 ? idx + 1 : 0;
          })()
        : (() => {
            const idx = storyUsers.findIndex((u) => u.name === profileUser.name);
            return idx >= 0 ? idx + 1 : 0;
          })()
      : 0;

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
          <NotificationsButtonMui />
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
          {/* Avatar: borda dourada (ranking) ou anel de stories (24h); botão Adicionar story no próprio perfil */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                {(() => {
                  const hasStories = profileStories.length > 0;
                  const showStoryRing = hasUnseenStories;
                  const avatarEl = (
                    <Avatar
                      src={displayAvatar || undefined}
                      sx={{
                        width: { xs: 96, sm: 112 },
                        height: { xs: 96, sm: 112 },
                        background: isFeaturedStory ? 'linear-gradient(135deg, #60a5fa, #a855f7)' : 'grey.300',
                        fontSize: { xs: 32, sm: 40 },
                        fontWeight: 'bold',
                        color: isFeaturedStory ? undefined : 'text.secondary',
                      }}
                    >
                      {profileUser.initials}
                    </Avatar>
                  );
                  const wrappedAvatar = isFeaturedStory ? (
                    <Box
                      sx={{
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #d97706 100%)',
                        p: 0.5,
                        boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)',
                      }}
                    >
                      <Box sx={{ borderRadius: '50%', bgcolor: 'background.paper', p: 0.5 }}>
                        <Badge
                          overlap="circular"
                          badgeContent={<TrophyIcon sx={{ fontSize: 22, color: '#fff', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }} />}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          sx={{
                            '& .MuiBadge-badge': {
                              background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #d97706 100%)',
                              color: 'inherit',
                              p: 0.25,
                              minWidth: 28,
                              height: 28,
                              borderRadius: '50%',
                              border: 'none',
                              boxShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
                            },
                          }}
                        >
                          {avatarEl}
                        </Badge>
                      </Box>
                    </Box>
                  ) : showStoryRing ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setStoryViewerOpen(true)}
                      sx={{
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #facc15 0%, #ec4899 50%, #9333ea 100%)',
                        borderRadius: '50%',
                        p: '3px',
                        boxShadow: '0 0 12px rgba(236, 72, 153, 0.4)',
                      }}
                    >
                      <Box sx={{ borderRadius: '50%', bgcolor: 'background.paper', p: '3px' }}>
                        {avatarEl}
                      </Box>
                    </Box>
                  ) : hasStories ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setStoryViewerOpen(true)}
                      sx={{ border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%' }}
                    >
                      {avatarEl}
                    </Box>
                  ) : (
                    avatarEl
                  );
                  return wrappedAvatar;
                })()}
              </Box>
              {isOwnProfile && (
                <Tooltip title="Adicionar story (aparece no seu perfil por 24h)">
                  <IconButton
                    onClick={() => setAddStoryOpen(true)}
                    sx={{
                      width: 44,
                      height: 44,
                      border: '2px dashed',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' },
                    }}
                  >
                    <AddIcon sx={{ color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {profileStoriesLoading && profileAccountId && (
              <Typography variant="caption" color="text.secondary">Carregando stories...</Typography>
            )}
            {!profileStoriesLoading && isOwnProfile && profileStories.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {profileStories.length} story{profileStories.length !== 1 ? 's' : ''} ativo{profileStories.length !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
              {profileUser.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Membro da comunidade desde {'created_at' in profileUser && profileUser.created_at
                ? new Date(profileUser.created_at).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
                : 'data desconhecida'}
            </Typography>

            {/* Stats */}
            <Stack
              direction="row"
              spacing={3}
              sx={{
                justifyContent: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {userPosts.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  publicações
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {profileUser.interactionCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  interações
                </Typography>
              </Box>
              {rankingPosition > 0 && (
                <Link
                  href="/dashboard/comunidade/ranking"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {rankingPosition}º
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ranking
                    </Typography>
                  </Box>
                </Link>
              )}
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
                        Dados atualizados a cada 7 dias
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box
                    sx={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
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

            {/* Cursos (ex.: Roteiro Viral) */}
            {'courseIds' in profileUser && profileUser.courseIds && profileUser.courseIds.length > 0 && (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                sx={{ mb: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}
              >
                {sortCourseIds(profileUser.courseIds ?? []).map((id) => {
                  const label = getCourseLabel(id);
                  if (!label) return null;
                  return (
                    <Chip
                      key={id}
                      icon={<SchoolIcon sx={{ fontSize: 14 }} />}
                      label={label}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '& .MuiChip-icon': { color: 'text.secondary', opacity: 0.8 },
                      }}
                    />
                  );
                })}
              </Stack>
            )}

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
                    sx={{ height: 24, fontSize: '0.625rem', fontWeight: 500 }}
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

                {/* Video — #t=0.1 + preload="metadata" para exibir a capa (igual ao feed) */}
                {post.videoUrl && (
                  <Box sx={{ mb: 1.5, mx: { xs: -1.5, sm: -2 } }}>
                    <Box
                      component="video"
                      src={`${post.videoUrl}#t=0.1`}
                      controls
                      preload="metadata"
                      playsInline
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

      {/* Viewer de stories (fullscreen) */}
      <StoryViewer
        stories={profileStories}
        userName={profileUser.name}
        open={storyViewerOpen}
        initialIndex={initialStoryIndex}
        onClose={(opts) => {
          if (opts?.completedAll && profileAccountId) {
            const now = Date.now();
            try {
              localStorage.setItem(STORIES_SEEN_KEY + profileAccountId, String(now));
            } catch {}
            setLastStoriesSeenAt(now);
          }
          setStoryViewerOpen(false);
        }}
        canDelete={isOwnProfile}
        onDeleteStory={
          isOwnProfile && (profileAccountId ?? account?.id)
            ? async (storyId: string) => {
                const accountId = profileAccountId ?? account?.id ?? '';
                try {
                  const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
                  if (!res.ok) {
                    const contentType = res.headers.get('content-type') ?? '';
                    const data = contentType.includes('application/json') ? await res.json() : {};
                    throw new Error(typeof data?.error === 'string' ? data.error : 'Erro ao excluir. Tente novamente.');
                  }
                  if (accountId) {
                    const listRes = await fetch(`/api/accounts/${accountId}/stories`);
                    if (listRes.ok) {
                      const list = await listRes.json();
                      setProfileStories(Array.isArray(list) ? list : []);
                    }
                  }
                } catch (e) {
                  alert(e instanceof Error ? e.message : 'Algo deu errado ao excluir. Tente novamente.');
                  throw e;
                }
              }
            : undefined
        }
      />

      {/* Dialog: escolher foto ou vídeo e publicar */}
      <Dialog
        open={addStoryOpen}
        onClose={() => {
          if (!addStoryUploading) {
            setAddStoryOpen(false);
            setAddStoryFile(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar story</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sua foto ou vídeo aparece no seu perfil público por 24 horas.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<PhotoLibraryIcon />}
            sx={{ py: 2 }}
          >
            {addStoryFile ? addStoryFile.name : 'Escolher imagem ou vídeo'}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/mov"
              onChange={(e) => setAddStoryFile(e.target.files?.[0] ?? null)}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddStoryOpen(false);
              setAddStoryFile(null);
            }}
            disabled={addStoryUploading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddStorySubmit}
            disabled={!addStoryFile || addStoryUploading}
          >
            {addStoryUploading ? 'Publicando...' : 'Publicar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

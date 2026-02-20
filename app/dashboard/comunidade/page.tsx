'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';
import { StoriesMui } from '@/components/community/StoriesMui';
import { PostCardMui } from '@/components/community/PostCardMui';
import { CommentsSectionMui } from '@/components/community/CommentsSectionMui';
import { NotificationsButtonMui } from '@/components/community/NotificationsButtonMui';
import { FloatingChatButtonMui } from '@/components/chat/FloatingChatButtonMui';
import { DomeLogo } from '@/components/ui/DomeLogo';

import { usePosts, Post } from '@/contexts/PostsContext';
import { useStories } from '@/contexts/StoriesContext';
import { useAccount } from '@/contexts/AccountContext';

export default function ComunidadePageMui() {
  const router = useRouter();
  const {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    isInitialized,
    fetchPosts,
    loadMorePosts,
    refreshPosts,
    toggleLike,
    toggleSave,
    updatePost,
    removePost,
  } = usePosts();

  const { account, fullName, isSubscriptionActive, isLoading: isAccountLoading } = useAccount();
  const { users: storyUsers } = useStories();
  const pathname = usePathname();
  const publicProfileHref = account?.id ? `/dashboard/comunidade/perfil/${account.id}` : '/dashboard/perfil';
  const isProfileActive = pathname === publicProfileHref;

  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const navigateToPost = (postId: string) => {
    sessionStorage.setItem('communityScrollPosition', window.scrollY.toString());
    router.push(`/dashboard/comunidade/${postId}`);
  };

  useEffect(() => {
    if (!isInitialized) {
      fetchPosts(1);
    }
  }, [isInitialized, fetchPosts]);

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('communityScrollPosition');
    if (savedScrollPosition && isInitialized) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
      }, 100);
      sessionStorage.removeItem('communityScrollPosition');
    }
  }, [isInitialized]);

  const handleDoubleTap = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post && !post.liked) {
      toggleLike(postId);
      setShowHeartAnimation(postId);
      setTimeout(() => setShowHeartAnimation(null), 1000);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingPostId(postId);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir post');
      }

      removePost(postId);
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      alert('Erro ao excluir post. Tente novamente.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const isMyPost = (post: Post) => {
    return account?.id === post.author.id;
  };

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore || showSavedOnly) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMorePosts, showSavedOnly]);

  const displayedPosts = showSavedOnly
    ? posts.filter(post => post.saved === true)
    : posts;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: 672,
          width: '100%',
          pb: { xs: 12, sm: 4 },
          bgcolor: 'background.paper',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Header Fixo */}
        <AppBar
          position="fixed"
          sx={{
            width: { xs: '100%', md: 'calc(100% - 256px)' },
          }}
        >
          <Box sx={{ maxWidth: 672, mx: 'auto', width: '100%' }}>
            <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DomeLogo style={{ fontSize: 18, fontWeight: 600 }} />
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <NotificationsButtonMui />
                <IconButton
                  onClick={refreshPosts}
                  disabled={isRefreshing}
                  sx={{ display: { xs: 'flex', sm: 'none' } }}
                >
                  <RefreshIcon
                    sx={{
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
                <Button
                  variant={showSavedOnly ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  startIcon={showSavedOnly ? <BookmarkIcon sx={{ color: 'white' }} /> : <BookmarkBorderIcon sx={{ color: 'text.primary' }} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    minWidth: {
                      xs: 32,
                      sm: 100,
                    },
                    px: { xs: 2, sm: 2 },
                    '& .MuiButton-startIcon': {
                      mr: { xs: 0, sm: 1 },
                    },
                    ...(showSavedOnly && {
                      background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                    }),
                    borderColor: showSavedOnly ? 'transparent' : 'text.secondary',
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, color: showSavedOnly ? 'white' : 'text.primary' }}>
                    {showSavedOnly ? 'Todos' : 'Salvos'}
                  </Box>
                </Button>
                <IconButton
                  component={Link}
                  href={publicProfileHref}
                  aria-label="Meu perfil"
                  sx={{ display: { xs: 'flex', md: 'none' }, p: 0.5 }}
                >
                  <Avatar
                    src={account?.avatar_url || undefined}
                    sx={{
                      width: 36,
                      height: 36,
                      border: isProfileActive ? '2px solid' : '2px solid transparent',
                      borderColor: isProfileActive ? 'primary.main' : 'transparent',
                      background: !account?.avatar_url
                        ? 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)'
                        : undefined,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {!account?.avatar_url && (fullName || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Stack>
            </Toolbar>
          </Box>
        </AppBar>

        {/* Spacer para compensar o header fixo */}
        <Toolbar />

        {/* Refresh indicator */}
        {isRefreshing && (
          <Box
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
              color: 'white',
              textAlign: 'center',
              py: 1,
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            Atualizando feed...
          </Box>
        )}

        {/* Stories */}
        {storyUsers.length > 0 && (
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              py: 1.5,
              bgcolor: 'background.paper',
            }}
          >
            <StoriesMui users={storyUsers} />
          </Box>
        )}

        {/* Loading inicial */}
        {isLoading && posts.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Erro */}
        {error && !isLoading && posts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => fetchPosts(1, true)}
            >
              Tentar novamente
            </Button>
          </Box>
        )}

        {/* Feed */}
        <Stack spacing={0}>
          {displayedPosts.length === 0 && showSavedOnly ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <BookmarkBorderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" fontWeight={500} color="text.secondary">
                Nenhum post salvo ainda
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Salve posts que você gostou para encontrá-los facilmente depois
              </Typography>
            </Box>
          ) : displayedPosts.length === 0 && !isLoading ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <Typography variant="body1" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                Nenhum post ainda
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                Seja o primeiro a compartilhar com a comunidade!
              </Typography>
              <Button
                component={Link}
                href="/dashboard/comunidade/criar"
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                }}
              >
                Criar post
              </Button>
            </Box>
          ) : (
            displayedPosts.map((post) => (
              <PostCardMui
                key={post.id}
                post={post}
                isMyPost={isMyPost(post)}
                onLike={() => toggleLike(post.id)}
                onSave={() => toggleSave(post.id)}
                onComment={() => setActiveCommentsPostId(post.id)}
                onDelete={() => handleDeletePost(post.id)}
                onNavigate={() => navigateToPost(post.id)}
                onDoubleTap={() => handleDoubleTap(post.id)}
                showHeartAnimation={showHeartAnimation === post.id}
                isDeleting={deletingPostId === post.id}
              />
            ))
          )}

          {/* Load more */}
          {hasMore && posts.length > 0 && !showSavedOnly && (
            <Box ref={loadMoreRef} sx={{ textAlign: 'center', py: 2 }}>
              {isLoadingMore && (
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Carregando mais posts...
                  </Typography>
                </Stack>
              )}
            </Box>
          )}
        </Stack>

        {/* Floating chat */}
        {!activeCommentsPostId && <FloatingChatButtonMui />}

        {/* Comments modal */}
        {activeCommentsPostId && (
          <CommentsSectionMui
            postId={activeCommentsPostId}
            isOpen={!!activeCommentsPostId}
            onClose={() => setActiveCommentsPostId(null)}
            onCommentAdded={() => {
              updatePost(activeCommentsPostId, {
                comments_count: (posts.find(p => p.id === activeCommentsPostId)?.comments_count || 0) + 1
              });
            }}
          />
        )}
      </Box>
    </Box>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageCarousel } from '@/components/community/ImageCarousel';
import { Stories } from '@/components/community/Stories';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { CommentsSection } from '@/components/community/CommentsSection';
import { usePosts, Post } from '@/contexts/PostsContext';
import { communityUsers } from '@/lib/community-users';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral';

const categoryLabels: Record<PostCategory, string> = {
  ideia: '💡 Ideia',
  resultado: '🏆 Resultado',
  duvida: '❓ Dúvida',
  roteiro: '📝 Roteiro',
  geral: '💬 Geral',
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

export default function ComunidadePage() {
  const router = useRouter();

  // Usar o contexto de posts
  const {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    page,
    isInitialized,
    fetchPosts,
    loadMorePosts,
    refreshPosts,
    toggleLike,
    toggleSave,
  } = usePosts();

  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Ref para o elemento sentinela do Intersection Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Função para navegar para o post salvando a posição do scroll
  const navigateToPost = (postId: string) => {
    sessionStorage.setItem('communityScrollPosition', window.scrollY.toString());
    router.push(`/dashboard/comunidade/${postId}`);
  };

  // Carregar posts apenas na primeira vez (se ainda não inicializado)
  useEffect(() => {
    if (!isInitialized) {
      fetchPosts(1);
    }
  }, [isInitialized, fetchPosts]);

  // Restaurar scroll ao voltar
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('communityScrollPosition');
    if (savedScrollPosition && isInitialized) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
      }, 100);
      sessionStorage.removeItem('communityScrollPosition');
    }
  }, [isInitialized]);

  // Duplo clique para curtir (estilo Instagram)
  const handleDoubleTap = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post && !post.liked) {
      toggleLike(postId);
      setShowHeartAnimation(postId);
      setTimeout(() => setShowHeartAnimation(null), 1000);
    }
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

  // Filtrar posts - mostrar todos ou apenas salvos
  const displayedPosts = showSavedOnly
    ? posts.filter(post => post.saved === true)
    : posts;

  return (
    <div className="max-w-2xl mx-auto w-full pb-24 sm:pb-8 bg-white dark:bg-black min-h-screen overflow-x-hidden">
      <div className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-neutral-800 px-4 py-3 mb-0 shadow-sm backdrop-blur-lg bg-white/95 dark:bg-black/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IA</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">Comunidade</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshPosts}
              disabled={isRefreshing}
              className="sm:hidden w-8 h-8 flex items-center justify-center text-gray-600 dark:text-slate-400 active:bg-gray-100 dark:active:bg-slate-800 rounded-full transition-all"
            >
              <svg
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`inline-flex items-center justify-center text-sm px-3 sm:px-4 py-2 h-auto shadow-md rounded-lg font-medium transition-all ${showSavedOnly
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
                }`}
            >
              <svg
                className="w-4 h-4 sm:mr-1.5"
                fill={showSavedOnly ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={showSavedOnly ? 0 : 1.5}
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
              <span className="hidden sm:inline">
                {showSavedOnly ? 'Todos' : 'Salvos'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de refresh */}
      {isRefreshing && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-xs font-medium">
          Atualizando feed...
        </div>
      )}

      <div className="mb-0 bg-white dark:bg-black border-b border-gray-200 dark:border-neutral-800 pb-3 pt-3 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen sm:static sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 sm:w-full">
        <Stories users={communityUsers} />
      </div>

      {/* Loading inicial */}
      {isLoading && posts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erro */}
      {error && !isLoading && posts.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchPosts(1, true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Feed de posts - estilo Instagram */}
      <div className="space-y-0">
        {displayedPosts.length === 0 && showSavedOnly ? (
          <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-neutral-800 p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-slate-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
            <p className="text-gray-600 dark:text-slate-300 font-medium mb-1">Nenhum post salvo ainda</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Salve posts que você gostou para encontrá-los facilmente depois</p>
          </div>
        ) : displayedPosts.length === 0 && !isLoading ? (
          <div className="bg-white dark:bg-black p-8 text-center">
            <p className="text-gray-600 dark:text-slate-300 font-medium mb-2">Nenhum post ainda</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Seja o primeiro a compartilhar com a comunidade!</p>
            <Link
              href="/dashboard/comunidade/criar"
              className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Criar post
            </Link>
          </div>
        ) : (
          displayedPosts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-black border-b border-gray-200 dark:border-neutral-800 last:border-b-0 overflow-hidden">
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <Link
                    href={`/dashboard/comunidade/perfil/${post.author.id}`}
                    className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 group"
                  >
                    {post.author.avatar_url ? (
                      <img
                        src={post.author.avatar_url}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-slate-600 flex-shrink-0 group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 group-hover:opacity-90 transition-opacity">
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate group-hover:underline">{post.author.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </Link>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full flex-shrink-0">
                    {categoryLabels[post.category] || '💬 Geral'}
                  </span>
                </div>

                {post.content && (
                  <div
                    className="text-sm text-gray-900 dark:text-slate-100 whitespace-pre-line break-words mb-3 leading-relaxed cursor-pointer hover:text-gray-700 dark:hover:text-slate-200 transition-colors overflow-hidden [word-break:break-word]"
                    onClick={() => navigateToPost(post.id)}
                  >
                    {post.content}
                  </div>
                )}

                {/* Carrossel de Imagens - múltiplas imagens */}
                {post.images && post.images.length > 1 && (
                  <div
                    className="mb-3 -mx-3 sm:-mx-4 relative overflow-hidden w-[calc(100%+24px)] sm:w-[calc(100%+32px)]"
                    onDoubleClick={() => handleDoubleTap(post.id)}
                  >
                    <ImageCarousel images={post.images} />
                    {/* Animação de coração ao dar duplo clique */}
                    {showHeartAnimation === post.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg
                          className="w-24 h-24 text-white drop-shadow-2xl animate-ping"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                {/* Imagem única - clicável */}
                {post.images && post.images.length === 1 && (
                  <div
                    className="mb-3 -mx-3 sm:-mx-4 relative cursor-pointer overflow-hidden w-[calc(100%+24px)] sm:w-[calc(100%+32px)]"
                    onClick={() => navigateToPost(post.id)}
                    onDoubleClick={() => handleDoubleTap(post.id)}
                  >
                    <img
                      src={post.images[0]}
                      alt="Post image"
                      className="w-full h-[70vh] sm:h-auto sm:aspect-square object-cover bg-gray-100 dark:bg-slate-800"
                      loading="lazy"
                    />
                    {/* Animação de coração ao dar duplo clique */}
                    {showHeartAnimation === post.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg
                          className="w-24 h-24 text-white drop-shadow-2xl animate-ping"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                {/* Vídeo */}
                {post.video_url && (
                  <div
                    className="mb-3 -mx-3 sm:-mx-4 cursor-pointer overflow-hidden w-[calc(100%+24px)] sm:w-[calc(100%+32px)]"
                    onClick={() => navigateToPost(post.id)}
                  >
                    <video
                      src={post.video_url}
                      controls
                      className="w-full h-[70vh] sm:h-auto sm:max-h-[500px] object-contain bg-black"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* Link da rede social */}
                {post.link_instagram_post && (
                  <a
                    href={post.link_instagram_post}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-3"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {post.link_instagram_post.includes('instagram.com')
                      ? 'Ver post no Instagram'
                      : post.link_instagram_post.includes('tiktok.com')
                        ? 'Ver post no TikTok'
                        : (post.link_instagram_post.includes('x.com') || post.link_instagram_post.includes('twitter.com'))
                          ? 'Ver post no X'
                          : 'Ver post original'}
                  </a>
                )}

                {/* Ações - estilo Instagram */}
                <div className="flex items-center space-x-4 sm:space-x-6 pt-3">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center space-x-1.5 transition-all active:scale-95 ${post.liked ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-slate-100'
                      }`}
                  >
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7"
                      fill={post.liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={post.liked ? 0 : 1.5}
                      viewBox="0 0 24 24"
                    >
                      {post.liked ? (
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                        />
                      )}
                    </svg>
                    <span className="text-sm sm:text-base font-semibold">{post.likes_count}</span>
                  </button>
                  <button
                    onClick={() => setActiveCommentsPostId(post.id)}
                    className="flex items-center space-x-1.5 text-gray-900 dark:text-slate-100 active:scale-95 transition-all"
                  >
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base font-semibold">{post.comments_count}</span>
                  </button>
                  <button
                    onClick={() => toggleSave(post.id)}
                    className={`flex items-center space-x-1.5 active:scale-95 transition-all ml-auto ${post.saved ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-slate-100'
                      }`}
                  >
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7"
                      fill={post.saved ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={post.saved ? 0 : 1.5}
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Sentinela para lazy loading */}
        {hasMore && posts.length > 0 && !showSavedOnly && (
          <div ref={loadMoreRef} className="p-4 text-center">
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Carregando mais posts...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão flutuante de chat - esconde quando modal de comentários está aberto */}
      {!activeCommentsPostId && <FloatingChatButton />}

      {/* Modal de comentários */}
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

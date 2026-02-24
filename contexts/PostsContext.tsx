'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral';

export interface PostAuthor {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  images: string[];
  video_url?: string;
  link_instagram_post?: string;
  category: PostCategory;
  likes_count: number;
  comments_count: number;
  created_at: string;
  liked?: boolean;
  saved?: boolean;
  is_pinned?: boolean;
}

interface PostsContextType {
  // Estado
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  isInitialized: boolean;

  // Ações
  fetchPosts: (pageNum?: number, refresh?: boolean) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  addPostToFeed: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

const POSTS_PER_PAGE = 10;

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Buscar posts da API
  const fetchPosts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(`/api/posts?page=${pageNum}&limit=${POSTS_PER_PAGE}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar posts');
      }

      const data = await response.json();

      if (refresh || pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
      setError(null);
      setIsInitialized(true);
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
      setError('Não foi possível carregar os posts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Carregar mais posts (próxima página)
  const loadMorePosts = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      await fetchPosts(page + 1);
    }
  }, [fetchPosts, isLoadingMore, hasMore, page]);

  // Atualizar posts (pull to refresh)
  const refreshPosts = useCallback(async () => {
    await fetchPosts(1, true);
  }, [fetchPosts]);

  // Adicionar novo post ao topo do feed
  const addPostToFeed = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  // Atualizar um post específico
  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, ...updates } : post))
    );
  }, []);

  // Remover post do feed
  const removePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  }, []);

  // Toggle like (otimista)
  const toggleLike = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const newLiked = !post.liked;
          return {
            ...post,
            liked: newLiked,
            likes_count: newLiked ? post.likes_count + 1 : post.likes_count - 1,
          };
        }
        return post;
      })
    );

    // Chamar API em background
    fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
    }).catch(err => {
      console.error('Erro ao dar like:', err);
      // Reverter em caso de erro
      setPosts(prev =>
        prev.map(post => {
          if (post.id === postId) {
            const newLiked = !post.liked;
            return {
              ...post,
              liked: newLiked,
              likes_count: newLiked ? post.likes_count + 1 : post.likes_count - 1,
            };
          }
          return post;
        })
      );
    });
  }, []);

  // Toggle save (otimista)
  const toggleSave = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );

    // Chamar API em background
    fetch(`/api/posts/${postId}/save`, {
      method: 'POST',
    }).catch(err => {
      console.error('Erro ao salvar:', err);
      // Reverter em caso de erro
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, saved: !post.saved } : post
        )
      );
    });
  }, []);

  return (
    <PostsContext.Provider
      value={{
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
        addPostToFeed,
        updatePost,
        removePost,
        toggleLike,
        toggleSave,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}

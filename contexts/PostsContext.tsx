'use client';

import React, { createContext, useContext, useState } from 'react';

type PostType = 'idea' | 'script' | 'question' | 'result';

export interface Post {
  id: string;
  type: PostType;
  author: string;
  avatar: string | null;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked?: boolean;
}

interface PostsContextType {
  posts: Post[];
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  deletePost: (postId: string) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      type: 'idea',
      author: 'Pedro Silva',
      avatar: null,
      content: 'Acabei de descobrir uma técnica incrível para aumentar o engajamento nos stories! Quem quer saber mais? 🚀',
      likes: 24,
      comments: 8,
      timeAgo: '2h',
      liked: false,
    },
    {
      id: '2',
      type: 'result',
      author: 'Maria Santos',
      avatar: null,
      content: 'Meu primeiro post viralizou! 1M de views em 24h usando as estratégias da comunidade! 🎉🔥',
      imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop',
      likes: 156,
      comments: 32,
      timeAgo: '5h',
      liked: true,
    },
    {
      id: '3',
      type: 'question',
      author: 'João Costa',
      avatar: null,
      content: 'Qual a melhor hora para postar no Instagram para o nicho de tecnologia? Estou testando diferentes horários mas queria saber a experiência de vocês 🤔',
      likes: 12,
      comments: 15,
      timeAgo: '1d',
      liked: false,
    },
    {
      id: '4',
      type: 'script',
      author: 'Ana Lima',
      avatar: null,
      content: 'Roteiro que me deu 500k views:\n\nGancho: "Você está perdendo dinheiro sem saber..."\nDesenvolvimento: Explico o problema\nSolução: Apresento a ferramenta\nCTA: "Salva esse post!"\n\nSimples e efetivo! 💡',
      likes: 89,
      comments: 21,
      timeAgo: '2d',
      liked: false,
    },
  ]);

  const addPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const updatePost = (postId: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, ...updates } : post))
    );
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, updatePost, deletePost }}>
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

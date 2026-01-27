'use client';

import React, { createContext, useContext, useState } from 'react';

type PostType = 'idea' | 'script' | 'question' | 'result';

export interface Comment {
  id: string;
  postId: string;
  parentId?: string; // ID do comentário pai (se for uma resposta)
  author: string;
  avatar: string | null;
  content: string;
  timeAgo: string;
  likes: number;
  liked?: boolean;
  replies?: number; // Número de respostas
}

export interface Post {
  id: string;
  type: PostType;
  author: string;
  avatar: string | null;
  content: string;
  imageUrl?: string | null; // Para compatibilidade (imagem única)
  imageUrls?: string[]; // Para carrossel (múltiplas imagens)
  videoUrl?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked?: boolean;
  saved?: boolean;
}

interface PostsContextType {
  posts: Post[];
  comments: Comment[];
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  deletePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addComment: (postId: string, content: string, author: string, avatar: string | null, parentId?: string) => void;
  getPostComments: (postId: string) => Comment[];
  getCommentReplies: (commentId: string) => Comment[];
  updateComment: (commentId: string, updates: Partial<Comment>) => void;
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

  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c1',
      postId: '1',
      author: 'Ana Costa',
      avatar: null,
      content: 'Quero saber sim! Compartilha com a gente! 🙏',
      timeAgo: '1h',
      likes: 5,
      liked: false,
      replies: 2,
    },
    {
      id: 'c1-r1',
      postId: '1',
      parentId: 'c1',
      author: 'Pedro Silva',
      avatar: null,
      content: 'Vou fazer um post explicando!',
      timeAgo: '50min',
      likes: 2,
      liked: false,
    },
    {
      id: 'c1-r2',
      postId: '1',
      parentId: 'c1',
      author: 'Maria Santos',
      avatar: null,
      content: 'Ansiosa para ver! 👀',
      timeAgo: '30min',
      likes: 1,
      liked: false,
    },
    {
      id: 'c2',
      postId: '1',
      author: 'Lucas Alves',
      avatar: null,
      content: 'Também tô curioso! Tá bombando suas visualizações?',
      timeAgo: '45min',
      likes: 3,
      liked: false,
      replies: 0,
    },
    {
      id: 'c3',
      postId: '2',
      author: 'João Santos',
      avatar: null,
      content: 'Parabéns! Qual foi o segredo?',
      timeAgo: '4h',
      likes: 12,
      liked: true,
      replies: 1,
    },
    {
      id: 'c3-r1',
      postId: '2',
      parentId: 'c3',
      author: 'Maria Santos',
      avatar: null,
      content: 'Usei as estratégias de storytelling que aprendi aqui!',
      timeAgo: '3h',
      likes: 5,
      liked: false,
    },
    {
      id: 'c4',
      postId: '2',
      author: 'Carla Mendes',
      avatar: null,
      content: 'Sensacional! 🚀🔥',
      timeAgo: '3h',
      likes: 8,
      liked: false,
      replies: 0,
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

  const toggleSavePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );
  };

  const addComment = (postId: string, content: string, author: string, avatar: string | null, parentId?: string) => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      parentId,
      author,
      avatar,
      content,
      timeAgo: 'agora',
      likes: 0,
      liked: false,
      replies: 0,
    };
    
    setComments((prev) => {
      const updated = [newComment, ...prev];
      
      // Se for uma resposta, atualizar o contador de replies do comentário pai
      if (parentId) {
        const parentComment = updated.find(c => c.id === parentId);
        if (parentComment) {
          parentComment.replies = (parentComment.replies || 0) + 1;
        }
      }
      
      return updated;
    });
    
    // Atualizar contador de comentários do post (só se não for resposta)
    if (!parentId) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        )
      );
    }
  };

  const getPostComments = (postId: string): Comment[] => {
    // Retorna apenas comentários principais (sem parentId)
    return comments.filter((comment) => comment.postId === postId && !comment.parentId);
  };

  const getCommentReplies = (commentId: string): Comment[] => {
    return comments.filter((comment) => comment.parentId === commentId);
  };

  const updateComment = (commentId: string, updates: Partial<Comment>) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      )
    );
  };

  return (
    <PostsContext.Provider 
      value={{ 
        posts, 
        comments,
        addPost, 
        updatePost, 
        deletePost,
        toggleSavePost,
        addComment,
        getPostComments,
        getCommentReplies,
        updateComment,
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

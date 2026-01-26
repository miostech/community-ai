'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { ImageUpload } from '@/components/community/ImageUpload';
import { Stories } from '@/components/community/Stories';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { useUser } from '@/contexts/UserContext';
import { useCreatePost } from '@/contexts/CreatePostContext';

type PostType = 'idea' | 'script' | 'question' | 'result';

interface Post {
  id: string;
  type: PostType;
  author: string;
  avatar: string | null; // URL da imagem ou null para usar iniciais
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  likes: number;
  comments: number;
  timeAgo: string;
  liked?: boolean;
}

// Usuários mais ativos para stories (baseado em interações) - ordenados por interação
const topUsers = [
  { id: '1', name: 'Maria Silva', avatar: null, initials: 'MS', interactionCount: 89 },
  { id: '2', name: 'Ana Costa', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', initials: 'AC', interactionCount: 76 },
  { id: '3', name: 'João Santos', avatar: null, initials: 'JS', interactionCount: 65 },
  { id: '4', name: 'Pedro Lima', avatar: null, initials: 'PL', interactionCount: 54 },
  { id: '5', name: 'Carla Mendes', avatar: null, initials: 'CM', interactionCount: 48 },
  { id: '6', name: 'Lucas Alves', avatar: null, initials: 'LA', interactionCount: 42 },
].sort((a, b) => b.interactionCount - a.interactionCount); // Ordenar por interação (maior para menor)

const mockPosts: Post[] = [
  {
    id: '1',
    type: 'idea',
    author: 'Maria Silva',
    avatar: null, // Sem foto, usa iniciais
    content: 'Ideia de conteúdo: "3 erros que todo criador comete no primeiro mês" - funciona muito bem para engajamento!',
    likes: 24,
    comments: 5,
    timeAgo: '2h',
  },
  {
    id: '2',
    type: 'script',
    author: 'João Santos',
    avatar: null,
    content: 'Hook: "Você já parou para pensar como o conteúdo que você consome molda suas decisões?"\n\nDesenvolvimento: [texto do desenvolvimento]\n\nCTA: "Compartilhe nos comentários sua experiência"',
    videoUrl: 'https://www.tiktok.com/@example/video/1234567890',
    likes: 18,
    comments: 3,
    timeAgo: '4h',
  },
  {
    id: '3',
    type: 'result',
    author: 'Ana Costa',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    content: 'Usei um roteiro gerado aqui e consegui 2.3k de alcance no último post! A estrutura de hook + storytelling fez toda diferença.',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
    likes: 42,
    comments: 12,
    timeAgo: '6h',
  },
  {
    id: '4',
    type: 'question',
    author: 'Pedro Lima',
    avatar: null,
    content: 'Alguém tem dicas de como adaptar conteúdo de Instagram para TikTok mantendo a essência?',
    videoUrl: 'https://www.instagram.com/p/ABC123xyz/',
    likes: 8,
    comments: 15,
    timeAgo: '8h',
  },
];

const postTypeLabels = {
  idea: '💡 Ideia',
  script: '📝 Roteiro',
  question: '❓ Dúvida',
  result: '🎉 Resultado',
};

export default function ComunidadePage() {
  const { user } = useUser();
  const { showCreateModal, openCreateModal, closeCreateModal } = useCreatePost();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [newPost, setNewPost] = useState({
    type: 'idea' as PostType,
    content: '',
    image: null as File | null,
    videoUrl: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null);

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  // Duplo clique para curtir (estilo Instagram)
  const handleDoubleTap = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post && !post.liked) {
      handleLike(postId);
      setShowHeartAnimation(postId);
      setTimeout(() => setShowHeartAnimation(null), 1000);
    }
  };

  // Pull to refresh (mobile)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular carregamento de novos posts
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const handleImageSelect = (file: File | null) => {
    setNewPost({ ...newPost, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handlePublish = () => {
    if (!newPost.content.trim() && !newPost.image && !newPost.videoUrl.trim()) {
      alert('Adicione conteúdo, imagem ou link de vídeo');
      return;
    }

    // Criar URL da imagem (em produção, fazer upload para servidor)
    const imageUrl = imagePreview;

    const post: Post = {
      id: Date.now().toString(),
      type: newPost.type,
      author: user.name,
      avatar: user.avatar || user.name.charAt(0).toUpperCase(),
      content: newPost.content,
      imageUrl: imageUrl,
      videoUrl: newPost.videoUrl || undefined,
      likes: 0,
      comments: 0,
      timeAgo: 'agora',
    };

    setPosts([post, ...posts]);
    closeCreateModal();
    setNewPost({ type: 'idea', content: '', image: null, videoUrl: '' });
    setImagePreview(null);
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-24 sm:pb-8 bg-white min-h-screen">
      {/* Header fixo no mobile - estilo Instagram */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 mb-0 shadow-sm backdrop-blur-lg bg-white/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IA</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Comunidade</h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* Botão de refresh manual (mobile) */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="sm:hidden w-8 h-8 flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-full transition-all"
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
          <Button 
            onClick={openCreateModal} 
            className="text-sm px-3 sm:px-4 py-2 h-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md"
            size="sm"
          >
              <svg className="w-4 h-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Criar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Indicador de refresh */}
      {isRefreshing && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-xs font-medium">
          Atualizando feed...
        </div>
      )}

      {/* Stories - estilo Instagram - largura completa */}
      <div className="mb-0 bg-white border-b border-gray-200 pb-3 pt-3 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <Stories users={topUsers} />
      </div>

      {/* Feed de posts - estilo Instagram */}
      <div className="space-y-0">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border-b border-gray-200 last:border-b-0">
            <div className="p-3 sm:p-4">
              {/* Header do post */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  {typeof post.avatar === 'string' && post.avatar.length > 2 ? (
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {typeof post.avatar === 'string' ? post.avatar : post.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">{post.author}</p>
                    <p className="text-xs text-gray-500">{post.timeAgo}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                  {postTypeLabels[post.type]}
                </span>
              </div>

              {/* Conteúdo */}
              <div className="text-sm text-gray-900 whitespace-pre-line break-words mb-3 leading-relaxed">
                {post.content}
              </div>

              {/* Imagem - estilo Instagram com duplo clique */}
              {post.imageUrl && (
                <div 
                  className="mb-3 -mx-3 sm:-mx-4 relative select-none"
                  onDoubleClick={() => handleDoubleTap(post.id)}
                >
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full aspect-square object-cover bg-gray-100"
                    loading="lazy"
                  />
                  {/* Animação de coração ao dar duplo clique */}
                  {showHeartAnimation === post.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg 
                        className="w-24 h-24 text-white drop-shadow-2xl animate-ping"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                  )}
                </div>
              )}

              {/* Vídeo embed */}
              {post.videoUrl && (
                <div className="mb-3">
                  <VideoEmbed url={post.videoUrl} />
                </div>
              )}

              {/* Ações - estilo Instagram */}
              <div className="flex items-center space-x-4 sm:space-x-6 pt-3">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1.5 transition-all active:scale-95 ${
                    post.liked ? 'text-red-600' : 'text-gray-900'
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
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    )}
                  </svg>
                  <span className="text-sm sm:text-base font-semibold">{post.likes}</span>
                </button>
                <button className="flex items-center space-x-1.5 text-gray-900 active:scale-95 transition-all">
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
                  <span className="text-sm sm:text-base font-semibold">{post.comments}</span>
                </button>
                <button className="flex items-center space-x-1.5 text-gray-900 active:scale-95 transition-all ml-auto">
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
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeCreateModal();
              setNewPost({ type: 'idea', content: '', image: null, videoUrl: '' });
              setImagePreview(null);
            }
          }}
        >
          <div className="w-full max-h-[95vh] sm:max-h-[90vh] sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Criar Post</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Compartilhe com a comunidade</p>
              </div>
              <button
                onClick={() => {
                  closeCreateModal();
                  setNewPost({ type: 'idea', content: '', image: null, videoUrl: '' });
                  setImagePreview(null);
                }}
                className="text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Tipo de Post - Pills */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Tipo de post</label>
                <div className="flex flex-wrap gap-2">
                  {(['idea', 'script', 'question', 'result'] as PostType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewPost({ ...newPost, type })}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        newPost.type === type
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {postTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Conteúdo</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-sm sm:text-base"
                  rows={5}
                  placeholder="O que você gostaria de compartilhar?"
                />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
                  {newPost.content.length} caracteres
                </p>
              </div>

              {/* Mídia - Tabs */}
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-xs sm:text-sm font-semibold text-gray-900">Adicionar mídia (opcional)</label>
                
                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-100">
                  <button
                    onClick={() => {
                      if (newPost.videoUrl) {
                        setNewPost({ ...newPost, videoUrl: '' });
                      }
                    }}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                      !newPost.videoUrl
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Imagem
                  </button>
                  <button
                    onClick={() => {
                      if (imagePreview) {
                        setImagePreview(null);
                        setNewPost({ ...newPost, image: null });
                      }
                    }}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                      newPost.videoUrl
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Vídeo
                  </button>
                </div>

                {/* Image Upload */}
                {!newPost.videoUrl && (
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    currentImage={imagePreview}
                  />
                )}

                {/* Video URL */}
                {!imagePreview && (
                  <div>
                    <input
                      type="url"
                      value={newPost.videoUrl}
                      onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="Cole o link do TikTok ou Instagram..."
                    />
                    {newPost.videoUrl && (
                      <div className="mt-3">
                        <VideoEmbed url={newPost.videoUrl} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Sempre visível */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-t border-gray-100 bg-gray-50 gap-3 sm:gap-4 safe-area-bottom">
              <button
                onClick={() => {
                  closeCreateModal();
                  setNewPost({ type: 'idea', content: '', image: null, videoUrl: '' });
                  setImagePreview(null);
                }}
                className="px-4 py-2.5 text-sm sm:text-base text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <Button 
                onClick={handlePublish}
                disabled={!newPost.content.trim() && !imagePreview && !newPost.videoUrl.trim()}
                className="disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base px-6 sm:px-8"
              >
                Publicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

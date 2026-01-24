'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { ImageUpload } from '@/components/community/ImageUpload';
import { useUser } from '@/contexts/UserContext';

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
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'idea' as PostType,
    content: '',
    image: null as File | null,
    videoUrl: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    setShowCreateModal(false);
    setNewPost({ type: 'idea', content: '', image: null, videoUrl: '' });
    setImagePreview(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Comunidade</h1>
          <p className="text-sm sm:text-base text-gray-600">Compartilhe e descubra conteúdo criado por outros criadores</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          Criar post
        </Button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  {typeof post.avatar === 'string' && post.avatar.length > 2 ? (
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm flex-shrink-0">
                      {typeof post.avatar === 'string' ? post.avatar : post.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{post.author}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{post.timeAgo}</p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                  {postTypeLabels[post.type]}
                </span>
              </div>

              <div className="text-sm sm:text-base text-gray-700 whitespace-pre-line break-words">{post.content}</div>

              {/* Imagem */}
              {post.imageUrl && (
                <div className="mt-4">
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full rounded-xl border border-gray-200"
                  />
                </div>
              )}

              {/* Vídeo embed */}
              {post.videoUrl && (
                <VideoEmbed url={post.videoUrl} />
              )}

              <div className="flex items-center space-x-4 sm:space-x-6 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 transition-colors ${
                    post.liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill={post.liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">{post.comments}</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewPost({ type: 'idea', content: '', image: null, videoUrl: '' });
              setImagePreview(null);
            }
          }}
        >
          <div className="w-full max-w-3xl bg-white rounded-xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Criar Post</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Compartilhe com a comunidade</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-sm sm:text-base"
                  rows={5}
                  placeholder="O que você gostaria de compartilhar?"
                />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
                  {newPost.content.length} caracteres
                </p>
              </div>

              {/* Mídia - Tabs */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Adicionar mídia (opcional)</label>
                
                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-100">
                  <button
                    onClick={() => {
                      if (newPost.videoUrl) {
                        setNewPost({ ...newPost, videoUrl: '' });
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

            {/* Footer */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-100 bg-gray-50 gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPost({ type: 'idea', content: '', image: null, videoUrl: '' });
                  setImagePreview(null);
                }}
                className="text-sm sm:text-base text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancelar
              </button>
              <Button 
                onClick={handlePublish}
                disabled={!newPost.content.trim() && !imagePreview && !newPost.videoUrl.trim()}
                className="disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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

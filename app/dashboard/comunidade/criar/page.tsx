'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/community/ImageUpload';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { useUser } from '@/contexts/UserContext';
import { usePosts } from '@/contexts/PostsContext';

type PostType = 'idea' | 'script' | 'question' | 'result';

const postTypeLabels: Record<PostType, string> = {
  idea: 'Ideia',
  script: 'Roteiro',
  question: 'Pergunta',
  result: 'Resultado',
};

export default function CriarPostPage() {
  const router = useRouter();
  const { user } = useUser();
  const { addPost } = usePosts();
  
  const [newPost, setNewPost] = useState<{
    type: PostType;
    content: string;
    image: File | null;
    videoUrl: string;
  }>({
    type: 'idea',
    content: '',
    image: null,
    videoUrl: '',
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (!newPost.content.trim() && !imagePreview && !newPost.videoUrl.trim()) {
      alert('Adicione conteúdo, imagem ou link de vídeo');
      return;
    }

    // Criar o novo post
    const post = {
      id: Date.now().toString(),
      type: newPost.type,
      author: user.name,
      avatar: user.avatar || null,
      content: newPost.content,
      imageUrl: imagePreview || undefined,
      videoUrl: newPost.videoUrl || undefined,
      likes: 0,
      comments: 0,
      timeAgo: 'agora',
      liked: false,
    };

    // Adicionar ao contexto
    addPost(post);
    
    // Redirecionar de volta para comunidade
    router.push('/dashboard/comunidade');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8 pt-2 sm:pt-4">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Criar Post</h1>
        <p className="text-sm sm:text-base text-gray-600">Compartilhe com a comunidade</p>
      </div>

      {/* Formulário */}
      <div className="space-y-6">
        {/* Tipo de Post */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Tipo de post</label>
          <div className="flex flex-wrap gap-2">
            {(['idea', 'script', 'question', 'result'] as PostType[]).map((type) => (
              <button
                key={type}
                onClick={() => setNewPost({ ...newPost, type })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
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
          <label className="block text-sm font-semibold text-gray-900 mb-2">Conteúdo</label>
          <textarea
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            rows={8}
            placeholder="O que você gostaria de compartilhar?"
            suppressHydrationWarning
          />
          <p className="text-xs text-gray-500 mt-2">
            {newPost.content.length} caracteres
          </p>
        </div>

        {/* Mídia */}
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Cole o link do TikTok ou Instagram..."
                suppressHydrationWarning
              />
              {newPost.videoUrl && (
                <div className="mt-3">
                  <VideoEmbed url={newPost.videoUrl} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/comunidade')}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!newPost.content.trim() && !imagePreview && !newPost.videoUrl.trim()}
            className="w-full sm:w-auto sm:ml-auto"
          >
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}

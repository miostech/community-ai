'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MultiImageUpload } from '@/components/community/MultiImageUpload';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { ImageCarousel } from '@/components/community/ImageCarousel';
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
    images: File[];
    videoUrl: string;
  }>({
    type: 'idea',
    content: '',
    images: [],
    videoUrl: '',
  });
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'video'>('images');

  const handleImagesSelect = (files: File[]) => {
    const newFiles = [...newPost.images, ...files].slice(0, 10); // Max 10 imagens
    setNewPost({ ...newPost, images: newFiles });

    // Criar previews
    const newPreviews = [...imagePreviews];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setImagePreviews(newPreviews.slice(0, 10));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = newPost.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setNewPost({ ...newPost, images: newImages });
    setImagePreviews(newPreviews);
  };

  const handlePublish = () => {
    if (!newPost.content.trim() && imagePreviews.length === 0 && !newPost.videoUrl.trim()) {
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
      // Se tiver múltiplas imagens, usa imageUrls; se tiver apenas uma, usa imageUrl
      ...(imagePreviews.length > 1
        ? { imageUrls: imagePreviews }
        : imagePreviews.length === 1
        ? { imageUrl: imagePreviews[0] }
        : {}),
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
              onClick={() => setActiveMediaTab('images')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeMediaTab === 'images'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Imagens {imagePreviews.length > 0 && `(${imagePreviews.length})`}
            </button>
            <button
              onClick={() => setActiveMediaTab('video')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeMediaTab === 'video'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Vídeo
            </button>
          </div>

          {/* Multi Image Upload */}
          {activeMediaTab === 'images' && (
            <MultiImageUpload
              onImagesSelect={handleImagesSelect}
              currentImages={imagePreviews}
              onRemoveImage={handleRemoveImage}
              maxImages={10}
            />
          )}

          {/* Video URL */}
          {activeMediaTab === 'video' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  💡 Cole o link de um vídeo do TikTok, Instagram ou YouTube
                </p>
              </div>
              <input
                type="url"
                value={newPost.videoUrl}
                onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://www.tiktok.com/@user/video/..."
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
            disabled={!newPost.content.trim() && imagePreviews.length === 0 && !newPost.videoUrl.trim()}
            className="w-full sm:w-auto sm:ml-auto"
          >
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MultiImageUpload } from '@/components/community/MultiImageUpload';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { useAccount } from '@/contexts/AccountContext';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral';

interface UploadedImage {
  url: string;
  isUploading: boolean;
  preview: string;
  error?: string;
}

const categoryLabels: Record<PostCategory, string> = {
  ideia: '💡 Ideia',
  resultado: '🏆 Resultado',
  duvida: '❓ Dúvida',
  roteiro: '📝 Roteiro',
  geral: '💬 Geral',
};

export default function CriarPostPage() {
  const router = useRouter();
  const { account } = useAccount();

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState<{
    category: PostCategory;
    content: string;
    videoUrl: string;
    link_instagram_post: string;
    link_tiktok_post: string;
    link_youtube_post: string;
  }>({
    category: 'geral',
    content: '',
    videoUrl: '',
    link_instagram_post: '',
    link_tiktok_post: '',
    link_youtube_post: '',
  });

  // Imagens com status de upload individual
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'video' | 'links'>('images');

  // Upload imediato ao selecionar imagens
  const handleImagesSelect = async (files: File[]) => {
    const remainingSlots = 10 - uploadedImages.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    // Criar previews e marcar como uploading
    const newImages: UploadedImage[] = [];

    for (const file of filesToUpload) {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push({
        url: '',
        isUploading: true,
        preview,
      });
    }

    // Adicionar imagens com status "uploading"
    setUploadedImages(prev => [...prev, ...newImages]);

    // Fazer upload de cada imagem individualmente
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const imageIndex = uploadedImages.length + i;

      try {
        const formData = new FormData();
        formData.append('type', 'image');
        formData.append('files', file);

        const response = await fetch('/api/posts/media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro no upload');
        }

        const data = await response.json();
        const uploadedUrl = data.urls[0];

        // Atualizar a imagem com a URL do Azure
        setUploadedImages(prev => prev.map((img, idx) =>
          idx === imageIndex
            ? { ...img, url: uploadedUrl, isUploading: false }
            : img
        ));
      } catch (err) {
        console.error('Erro no upload da imagem:', err);
        // Marcar como erro
        setUploadedImages(prev => prev.map((img, idx) =>
          idx === imageIndex
            ? { ...img, isUploading: false, error: 'Falha no upload' }
            : img
        ));
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = uploadedImages[index];

    // Remover da lista imediatamente
    setUploadedImages(prev => prev.filter((_, i) => i !== index));

    // Se já foi feito upload, deletar do Azure
    if (imageToRemove.url) {
      try {
        await fetch('/api/posts/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageToRemove.url }),
        });
      } catch (err) {
        console.error('Erro ao deletar imagem do Azure:', err);
        // Não bloqueia a remoção da UI
      }
    }
  };

  const handlePublish = async () => {
    const validImages = uploadedImages.filter(img => img.url && !img.isUploading && !img.error);

    if (!newPost.content.trim() && validImages.length === 0 && !newPost.videoUrl.trim()) {
      setError('Adicione conteúdo, imagem ou link de vídeo');
      return;
    }

    // Verificar se ainda há uploads em andamento
    const uploading = uploadedImages.some(img => img.isUploading);
    if (uploading) {
      setError('Aguarde o upload das imagens terminar');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const imageUrls = validImages.map(img => img.url);

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newPost.content,
          images: imageUrls,
          video_url: newPost.videoUrl || undefined,
          link_instagram_post: newPost.link_instagram_post || undefined,
          link_tiktok_post: newPost.link_tiktok_post || undefined,
          link_youtube_post: newPost.link_youtube_post || undefined,
          category: newPost.category,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao publicar post');
      }

      // Sucesso - redirecionar para comunidade
      router.push('/dashboard/comunidade');
    } catch (err) {
      console.error('Erro ao publicar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao publicar post');
    } finally {
      setIsPublishing(false);
    }
  };

  const isUploading = uploadedImages.some(img => img.isUploading);
  const validImageCount = uploadedImages.filter(img => img.url && !img.error).length;

  const hasLinks = newPost.link_instagram_post || newPost.link_tiktok_post || newPost.link_youtube_post;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8 pt-2 sm:pt-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Criar Post</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-400">Compartilhe com a comunidade</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Categoria do post */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-3">Tipo de post</label>
          <div className="flex flex-wrap gap-2">
            {(['ideia', 'resultado', 'duvida', 'roteiro', 'geral'] as PostCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewPost({ ...newPost, category: cat })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${newPost.category === cat
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-transparent dark:border-neutral-700'
                  }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-2">Conteúdo</label>
          <textarea
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none transition-all"
            rows={8}
            placeholder="O que você gostaria de compartilhar?"
            suppressHydrationWarning
          />
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2">
            {newPost.content.length}/5000 caracteres
          </p>
        </div>

        {/* Mídia */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900 dark:text-neutral-100">Adicionar mídia (opcional)</label>

          <div className="flex gap-2 border-b border-gray-100 dark:border-neutral-800">
            <button
              onClick={() => setActiveMediaTab('images')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeMediaTab === 'images'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
                }`}
            >
              📷 Imagens {uploadedImages.length > 0 && `(${uploadedImages.length})`}
              {isUploading && <span className="ml-1 animate-pulse">⏳</span>}
            </button>
            <button
              onClick={() => setActiveMediaTab('video')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeMediaTab === 'video'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
                }`}
            >
              🎬 Vídeo
            </button>
            <button
              onClick={() => setActiveMediaTab('links')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeMediaTab === 'links'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
                }`}
            >
              🔗 Links {hasLinks && '•'}
            </button>
          </div>

          {/* Tab Imagens */}
          {activeMediaTab === 'images' && (
            <div className="space-y-4">
              {/* Grid de imagens com status */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
                      <img
                        src={img.preview}
                        alt={`Imagem ${index + 1}`}
                        className={`w-full h-full object-cover ${img.isUploading ? 'opacity-50' : ''} ${img.error ? 'opacity-30' : ''}`}
                      />

                      {/* Overlay de loading */}
                      {img.isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}

                      {/* Overlay de sucesso */}
                      {img.url && !img.isUploading && !img.error && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">✓</span>
                        </div>
                      )}

                      {/* Overlay de erro */}
                      {img.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
                          <span className="text-white text-sm font-medium">Erro</span>
                        </div>
                      )}

                      {/* Botão remover */}
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão adicionar mais */}
              {uploadedImages.length < 10 && (
                <MultiImageUpload
                  onImagesSelect={handleImagesSelect}
                  currentImages={[]}
                  onRemoveImage={() => { }}
                  maxImages={10 - uploadedImages.length}
                />
              )}

              {/* Status geral */}
              {uploadedImages.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {validImageCount} de {uploadedImages.length} imagens prontas
                  {isUploading && ' • Fazendo upload...'}
                </p>
              )}
            </div>
          )}

          {/* Tab Vídeo */}
          {activeMediaTab === 'video' && (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Cole o link de um vídeo do TikTok, Instagram ou YouTube para embed
                </p>
              </div>
              <input
                type="url"
                value={newPost.videoUrl}
                onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
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

          {/* Tab Links das Redes */}
          {activeMediaTab === 'links' && (
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  🔗 Adicione os links do post nas redes sociais para a comunidade poder interagir lá também!
                </p>
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Instagram Post
                </label>
                <input
                  type="url"
                  value={newPost.link_instagram_post}
                  onChange={(e) => setNewPost({ ...newPost, link_instagram_post: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent transition-all"
                  placeholder="https://www.instagram.com/p/..."
                />
              </div>

              {/* TikTok */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  TikTok
                </label>
                <input
                  type="url"
                  value={newPost.link_tiktok_post}
                  onChange={(e) => setNewPost({ ...newPost, link_tiktok_post: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                  placeholder="https://www.tiktok.com/@user/video/..."
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  YouTube
                </label>
                <input
                  type="url"
                  value={newPost.link_youtube_post}
                  onChange={(e) => setNewPost({ ...newPost, link_youtube_post: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-neutral-800">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/comunidade')}
            disabled={isPublishing || isUploading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || isUploading || (!newPost.content.trim() && validImageCount === 0 && !newPost.videoUrl.trim())}
            className="w-full sm:w-auto sm:ml-auto"
          >
            {isUploading ? 'Aguarde o upload...' : isPublishing ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

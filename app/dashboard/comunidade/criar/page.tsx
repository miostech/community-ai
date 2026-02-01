'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MultiImageUpload } from '@/components/community/MultiImageUpload';
import { useAccount } from '@/contexts/AccountContext';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral';

interface UploadedImage {
  url: string;
  isUploading: boolean;
  preview: string;
  error?: string;
}

interface UploadedVideo {
  url: string;
  isUploading: boolean;
  preview: string;
  progress: number;
  error?: string;
  fileName?: string;
}

const categoryLabels: Record<PostCategory, string> = {
  ideia: 'Ideia',
  resultado: 'Resultado',
  duvida: 'Dúvida',
  roteiro: 'Roteiro',
  geral: 'Geral',
};

export default function CriarPostPage() {
  const router = useRouter();
  const { account } = useAccount();
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState<{
    category: PostCategory;
    content: string;
    link_instagram_post: string;
  }>({
    category: 'geral',
    content: '',
    link_instagram_post: '',
  });

  // Imagens com status de upload individual
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'video' | 'links'>('images');

  // Vídeo com status de upload
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);

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

  // Upload de vídeo
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError('Vídeo muito grande. Máximo 500MB.');
      return;
    }

    // Validar tipo
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use MP4, MOV, WEBM ou AVI.');
      return;
    }

    setError(null);

    // Criar preview do vídeo
    const preview = URL.createObjectURL(file);

    setUploadedVideo({
      url: '',
      isUploading: true,
      preview,
      progress: 0,
      fileName: file.name,
    });

    try {
      const formData = new FormData();
      formData.append('type', 'video');
      formData.append('files', file);

      const response = await fetch('/api/posts/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro no upload do vídeo');
      }

      const data = await response.json();
      // API retorna 'url' para vídeo (singular), não 'urls'
      const uploadedUrl = data.url;

      if (!uploadedUrl) {
        throw new Error('URL do vídeo não retornada');
      }

      setUploadedVideo(prev => prev ? {
        ...prev,
        url: uploadedUrl,
        isUploading: false,
        progress: 100,
      } : null);
    } catch (err) {
      console.error('Erro no upload do vídeo:', err);
      setUploadedVideo(prev => prev ? {
        ...prev,
        isUploading: false,
        error: err instanceof Error ? err.message : 'Falha no upload',
      } : null);
    }
  };

  const handleRemoveVideo = async () => {
    if (!uploadedVideo) return;

    const videoUrl = uploadedVideo.url;

    // Revogar URL do preview
    if (uploadedVideo.preview) {
      URL.revokeObjectURL(uploadedVideo.preview);
    }

    setUploadedVideo(null);

    // Se já foi feito upload, deletar do Azure
    if (videoUrl) {
      try {
        await fetch('/api/posts/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: videoUrl }),
        });
      } catch (err) {
        console.error('Erro ao deletar vídeo do Azure:', err);
      }
    }
  };

  const handlePublish = async () => {
    const validImages = uploadedImages.filter(img => img.url && !img.isUploading && !img.error);
    const videoUrl = uploadedVideo?.url;

    if (!newPost.content.trim() && validImages.length === 0 && !videoUrl) {
      setError('Adicione conteúdo, imagem ou vídeo');
      return;
    }

    // Verificar se ainda há uploads em andamento
    const imageUploading = uploadedImages.some(img => img.isUploading);
    const videoUploading = uploadedVideo?.isUploading;
    if (imageUploading || videoUploading) {
      setError('Aguarde os uploads terminarem');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const imageUrls = validImages.map(img => img.url);
      const finalVideoUrl = uploadedVideo?.url || undefined;

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newPost.content,
          images: imageUrls,
          video_url: finalVideoUrl,
          link_instagram_post: newPost.link_instagram_post || undefined,
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

  const isImageUploading = uploadedImages.some(img => img.isUploading);
  const isVideoUploading = uploadedVideo?.isUploading || false;
  const isAnyUploading = isImageUploading || isVideoUploading;
  const validImageCount = uploadedImages.filter(img => img.url && !img.error).length;
  const hasVideo = !!uploadedVideo?.url;

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
              Imagens {uploadedImages.length > 0 && `(${uploadedImages.length})`}
              {isImageUploading && <span className="ml-1 animate-pulse">⏳</span>}
            </button>
            <button
              onClick={() => setActiveMediaTab('video')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeMediaTab === 'video'
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
                }`}
            >
              Vídeo {hasVideo && '✓'}
              {isVideoUploading && <span className="ml-1 animate-pulse">⏳</span>}
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
                  {isImageUploading && ' • Fazendo upload...'}
                </p>
              )}
            </div>
          )}

          {/* Tab Vídeo */}
          {activeMediaTab === 'video' && (
            <div className="space-y-4">
              {!uploadedVideo ? (
                <>
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      📹 Faça upload de um vídeo do seu dispositivo (MP4, MOV, WEBM - máx. 500MB)
                    </p>
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <span className="text-3xl">🎬</span>
                    <span className="text-sm font-medium">Clique para selecionar um vídeo</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  {/* Preview do vídeo */}
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video
                      src={uploadedVideo.preview}
                      controls
                      className={`w-full max-h-80 ${uploadedVideo.isUploading ? 'opacity-50' : ''}`}
                    />

                    {/* Overlay de loading */}
                    {uploadedVideo.isUploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-white text-sm">Enviando vídeo...</span>
                      </div>
                    )}

                    {/* Badge de sucesso */}
                    {uploadedVideo.url && !uploadedVideo.isUploading && !uploadedVideo.error && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">✓ Vídeo pronto</span>
                      </div>
                    )}

                    {/* Badge de erro */}
                    {uploadedVideo.error && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">Erro no upload</span>
                      </div>
                    )}

                    {/* Botão remover */}
                    <button
                      onClick={handleRemoveVideo}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-lg"
                    >
                      ×
                    </button>
                  </div>

                  {/* Nome do arquivo */}
                  {uploadedVideo.fileName && (
                    <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                      📁 {uploadedVideo.fileName}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Link da rede social (opcional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-2">
            Link da publicação na rede social <span className="font-normal text-gray-400 dark:text-neutral-500">(opcional)</span>
          </label>
          <input
            type="url"
            value={newPost.link_instagram_post}
            onChange={(e) => setNewPost({ ...newPost, link_instagram_post: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder="https://instagram.com/p/... ou tiktok.com/... ou youtube.com/..."
          />
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5">
            Cole o link do post no Instagram, TikTok ou YouTube
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-neutral-800">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/comunidade')}
            disabled={isPublishing || isAnyUploading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || isAnyUploading || (!newPost.content.trim() && validImageCount === 0 && !hasVideo)}
            className="w-full sm:w-auto sm:ml-auto"
          >
            {isAnyUploading ? 'Aguarde o upload...' : isPublishing ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

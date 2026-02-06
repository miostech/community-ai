'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import { usePosts } from '@/contexts/PostsContext';
import {
  AppBar,
  Toolbar,
  Avatar,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  Paper,
  Stack,
  Tab,
  Tabs,
  IconButton,
  LinearProgress,
  Fade,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Movie as MovieIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { MultiImageUpload } from '@/components/community/MultiImageUpload';

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

export default function CriarPostPageMui() {
  const router = useRouter();
  const { account } = useAccount();
  const { addPostToFeed } = usePosts();
  const theme = useTheme();
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

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [activeMediaTab, setActiveMediaTab] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);

  // Upload imediato ao selecionar imagens
  const handleImagesSelect = async (files: File[]) => {
    const remainingSlots = 10 - uploadedImages.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

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

    setUploadedImages((prev) => [...prev, ...newImages]);

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

        setUploadedImages((prev) =>
          prev.map((img, idx) =>
            idx === imageIndex ? { ...img, url: uploadedUrl, isUploading: false } : img
          )
        );
      } catch (err) {
        console.error('Erro no upload da imagem:', err);
        setUploadedImages((prev) =>
          prev.map((img, idx) =>
            idx === imageIndex ? { ...img, isUploading: false, error: 'Falha no upload' } : img
          )
        );
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = uploadedImages[index];
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));

    if (imageToRemove.url) {
      try {
        await fetch('/api/posts/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageToRemove.url }),
        });
      } catch (err) {
        console.error('Erro ao deletar imagem do Azure:', err);
      }
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024 * 1024) {
      setError('Vídeo muito grande. Máximo 4GB.');
      return;
    }

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use MP4, MOV, WEBM ou AVI.');
      return;
    }

    setError(null);
    const preview = URL.createObjectURL(file);

    setUploadedVideo({
      url: '',
      isUploading: true,
      preview,
      progress: 0,
      fileName: file.name,
    });

    try {
      // 1. Pedir SAS URL do backend
      const sasResponse = await fetch('/api/posts/media/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!sasResponse.ok) {
        const data = await sasResponse.json();
        throw new Error(data.error || 'Erro ao obter URL de upload');
      }

      const { sasUrl, finalUrl } = await sasResponse.json();

      console.log('📤 Upload direto para Azure:', { sasUrl: sasUrl.substring(0, 100) + '...', finalUrl });

      // 2. Upload direto para Azure com progresso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadedVideo((prev) =>
              prev ? { ...prev, progress } : null
            );
          }
        });

        xhr.addEventListener('load', () => {
          console.log('📤 XHR Load:', { status: xhr.status, response: xhr.responseText });
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload falhou: ${xhr.status} - ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('📤 XHR Error:', e, xhr.status, xhr.statusText);
          reject(new Error(`Erro de conexão: ${xhr.status} ${xhr.statusText}`));
        });
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')));

        xhr.open('PUT', sasUrl);
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // 3. Sucesso - atualizar com URL final
      setUploadedVideo((prev) =>
        prev ? { ...prev, url: finalUrl, isUploading: false, progress: 100 } : null
      );
    } catch (err) {
      console.error('Erro no upload do vídeo:', err);
      setUploadedVideo((prev) =>
        prev
          ? { ...prev, isUploading: false, error: err instanceof Error ? err.message : 'Falha no upload' }
          : null
      );
    }
  };

  const handleRemoveVideo = async () => {
    if (!uploadedVideo) return;

    const videoUrl = uploadedVideo.url;
    if (uploadedVideo.preview) {
      URL.revokeObjectURL(uploadedVideo.preview);
    }

    setUploadedVideo(null);

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
    const validImages = uploadedImages.filter((img) => img.url && !img.isUploading && !img.error);
    const videoUrl = uploadedVideo?.url;

    if (!newPost.content.trim() && validImages.length === 0 && !videoUrl) {
      setError('Adicione conteúdo, imagem ou vídeo');
      return;
    }

    const imageUploading = uploadedImages.some((img) => img.isUploading);
    const videoUploading = uploadedVideo?.isUploading;
    if (imageUploading || videoUploading) {
      setError('Aguarde os uploads terminarem');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const imageUrls = validImages.map((img) => img.url);
      const finalVideoUrl = uploadedVideo?.url || undefined;

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const data = await response.json();

      // Adicionar o novo post ao feed
      if (data.post) {
        addPostToFeed({
          id: data.post.id || data.post._id,
          author: {
            id: account?.id || '',
            name: `${account?.first_name || ''} ${account?.last_name || ''}`.trim() || 'Eu',
            avatar_url: account?.avatar_url || undefined,
          },
          content: newPost.content,
          images: imageUrls,
          video_url: finalVideoUrl || undefined,
          link_instagram_post: newPost.link_instagram_post || undefined,
          category: newPost.category,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          liked: false,
          saved: false,
        });
      }

      router.push('/dashboard/comunidade');
    } catch (err) {
      console.error('Erro ao publicar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao publicar post');
    } finally {
      setIsPublishing(false);
    }
  };

  const isImageUploading = uploadedImages.some((img) => img.isUploading);
  const isVideoUploading = uploadedVideo?.isUploading || false;
  const isAnyUploading = isImageUploading || isVideoUploading;
  const validImageCount = uploadedImages.filter((img) => img.url && !img.error).length;
  const hasVideo = !!uploadedVideo?.url;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: { xs: 20, sm: 4 } }}>
      {/* AppBar Fixo */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: 'calc(100% - 256px)' },
        }}
      >
        <Box sx={{ maxWidth: 800, mx: 'auto', width: '100%' }}>
          <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                edge="start"
                onClick={() => router.push('/dashboard/comunidade')}
                sx={{ color: 'inherit' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="bold">
                Criar Post
              </Typography>
            </Stack>
          </Toolbar>
        </Box>
      </AppBar>

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3 }}>

        {/* Error Alert */}
        <Fade in={!!error}>
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Fade>

        <Stack spacing={4}>
          {/* Categoria */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Tipo de post
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {(['ideia', 'resultado', 'duvida', 'roteiro', 'geral'] as PostCategory[]).map((cat) => (
                <Chip
                  key={cat}
                  label={categoryLabels[cat]}
                  onClick={() => setNewPost({ ...newPost, category: cat })}
                  variant={newPost.category === cat ? 'filled' : 'outlined'}
                  color={newPost.category === cat ? 'primary' : 'default'}
                  sx={{
                    borderRadius: 3,
                    fontWeight: newPost.category === cat ? 600 : 400,
                    transition: 'all 0.2s',
                    minHeight: 40,
                    px: 0.5,
                    fontSize: '0.875rem',
                    ...(newPost.category === cat && {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      color: 'white',
                      '& .MuiChip-label': { color: 'white' },
                    }),
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Conteúdo */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Conteúdo
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="O que você gostaria de compartilhar?"
              variant="outlined"
              inputProps={{ maxLength: 5000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {newPost.content.length}/5000 caracteres
            </Typography>
          </Box>

          {/* Mídia */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Adicionar mídia (opcional)
            </Typography>

            <Tabs
              value={activeMediaTab}
              onChange={(_, v) => setActiveMediaTab(v)}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<ImageIcon fontSize="small" />}
                iconPosition="start"
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <span>Imagens</span>
                    {uploadedImages.length > 0 && (
                      <Chip label={uploadedImages.length} size="small" color="primary" sx={{ height: 20 }} />
                    )}
                    {isImageUploading && <span style={{ marginLeft: 4 }}>⏳</span>}
                  </Stack>
                }
              />
              <Tab
                icon={<VideoIcon fontSize="small" />}
                iconPosition="start"
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <span>Vídeo</span>
                    {hasVideo && <CheckIcon fontSize="small" color="success" />}
                    {isVideoUploading && <span style={{ marginLeft: 4 }}>⏳</span>}
                  </Stack>
                }
              />
            </Tabs>

            {/* Tab Imagens */}
            {activeMediaTab === 0 && (
              <Stack spacing={2}>
                {uploadedImages.length > 0 && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                      gap: 2,
                    }}
                  >
                    {uploadedImages.map((img, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: 2,
                          overflow: 'hidden',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Box
                          component="img"
                          src={img.preview}
                          alt={`Imagem ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: img.isUploading ? 0.5 : img.error ? 0.3 : 1,
                          }}
                        />

                        {img.isUploading && (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: alpha('#000', 0.4),
                            }}
                          >
                            <Box sx={{ width: 32, height: 32, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
                          </Box>
                        )}

                        {img.url && !img.isUploading && !img.error && (
                          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                            <CheckIcon sx={{ color: 'success.main', bgcolor: 'white', borderRadius: '50%', fontSize: 20 }} />
                          </Box>
                        )}

                        {img.error && (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: alpha(theme.palette.error.main, 0.4),
                            }}
                          >
                            <ErrorIcon sx={{ color: 'white' }} />
                          </Box>
                        )}

                        <IconButton
                          onClick={() => handleRemoveImage(index)}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                {uploadedImages.length < 10 && (
                  <MultiImageUpload
                    onImagesSelect={handleImagesSelect}
                    currentImages={[]}
                    onRemoveImage={() => { }}
                    maxImages={10 - uploadedImages.length}
                  />
                )}

                {uploadedImages.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {validImageCount} de {uploadedImages.length} imagens prontas
                    {isImageUploading && ' • Fazendo upload...'}
                  </Typography>
                )}
              </Stack>
            )}

            {/* Tab Vídeo */}
            {activeMediaTab === 1 && (
              <Stack spacing={2}>
                {!uploadedVideo ? (
                  <>
                    <Box
                      onClick={() => videoInputRef.current?.click()}
                      sx={{
                        width: '100%',
                        aspectRatio: '16/9',
                        borderRadius: 3,
                        border: '2px dashed',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        bgcolor: theme.palette.mode === 'dark' ? 'neutral.800' : 'grey.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: theme.palette.mode === 'dark' ? 'neutral.700' : alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VideoIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" fontWeight={600}>
                          Adicionar vídeo
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          MP4, MOV, WEBM • Máx. 4GB
                        </Typography>
                      </Box>
                    </Box>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                      onChange={handleVideoSelect}
                      style={{ display: 'none', height: 0 }}
                    />
                  </>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: 'black',
                      }}
                    >
                      <video
                        src={uploadedVideo.preview}
                        controls
                        style={{
                          width: '100%',
                          maxHeight: 320,
                          opacity: uploadedVideo.isUploading ? 0.5 : 1,
                        }}
                      />

                      {uploadedVideo.isUploading && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha('#000', 0.6),
                          }}
                        >
                          <Box sx={{ width: 40, height: 40, border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', mb: 1 }} />
                          <Typography color="white" variant="body2">
                            Enviando vídeo... {uploadedVideo.progress}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={uploadedVideo.progress}
                            sx={{ width: '50%', mt: 1 }}
                          />
                        </Box>
                      )}

                      {uploadedVideo.url && !uploadedVideo.isUploading && !uploadedVideo.error && (
                        <Chip
                          icon={<CheckIcon />}
                          label="Vídeo pronto"
                          color="success"
                          size="small"
                          sx={{ position: 'absolute', top: 12, left: 12 }}
                        />
                      )}

                      {uploadedVideo.error && (
                        <Chip
                          icon={<ErrorIcon />}
                          label="Erro no upload"
                          color="error"
                          size="small"
                          sx={{ position: 'absolute', top: 12, left: 12 }}
                        />
                      )}

                      <IconButton
                        onClick={handleRemoveVideo}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' },
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>

                    {uploadedVideo.fileName && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        📁 {uploadedVideo.fileName}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            )}
          </Paper>

          {/* Link da rede social */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Link da publicação na rede social{' '}
              <Typography component="span" variant="caption" color="text.secondary">
                (opcional)
              </Typography>
            </Typography>
            <TextField
              fullWidth
              type="url"
              value={newPost.link_instagram_post}
              onChange={(e) => setNewPost({ ...newPost, link_instagram_post: e.target.value })}
              placeholder="https://instagram.com/p/... ou tiktok.com/..."
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <LinkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Cole o link do post no Instagram, TikTok ou YouTube
            </Typography>
          </Box>

          {/* Botões */}
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={2}
            sx={{
              pt: 2,
              pb: { xs: 2, sm: 0 },
              borderTop: 1,
              borderColor: 'divider',
              position: { xs: 'fixed', sm: 'static' },
              bottom: { xs: 0 },
              left: { xs: 0 },
              right: { xs: 0 },
              px: { xs: 2, sm: 0 },
              bgcolor: { xs: 'background.paper', sm: 'transparent' },
              zIndex: { xs: 1100, sm: 'auto' },
              boxShadow: { xs: '0 -2px 10px rgba(0,0,0,0.1)', sm: 'none' },
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard/comunidade')}
              disabled={isPublishing || isAnyUploading}
              sx={{ borderRadius: 3 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handlePublish}
              disabled={isPublishing || isAnyUploading || (!newPost.content.trim() && validImageCount === 0 && !hasVideo)}
              size="large"
              sx={{
                borderRadius: 3,
                py: { xs: 1, sm: 1 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                height: 48,
              }}
            >
              {isAnyUploading ? 'Aguarde o upload...' : isPublishing ? 'Publicando...' : 'Publicar'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    CircularProgress,
    Stack,
    Avatar,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    IconButton,
    Chip,
    Fab,
    Zoom,
} from '@mui/material';
import {
    FavoriteBorder as FavoriteBorderIcon,
    Favorite as FavoriteIcon,
    TextsmsOutlined as CommentIcon,
    BookmarkBorder as BookmarkBorderIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { ImageCarousel } from '@/components/community/ImageCarousel';
import { usePosts, Post } from '@/contexts/PostsContext';
import { useStories } from '@/contexts/StoriesContext';
import { StoriesMui } from '@/components/community/StoriesMui';
import { DomeLogo } from '@/components/ui/DomeLogo';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral' | 'atualizacao' | 'suporte';

const categoryLabels: Record<PostCategory, string> = {
    ideia: 'Ideia',
    resultado: 'Resultado',
    duvida: 'Dúvida',
    roteiro: 'Roteiro',
    geral: 'Geral',
    atualizacao: 'Atualização',
    suporte: 'Suporte',
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

/** Card de post real, mas com nome/ações ofuscados e interações desabilitadas */
function BlurredRealPostCard({ post }: { post: Post }) {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 0,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >
            {/* Header */}
            <CardHeader
                avatar={
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                            filter: 'blur(3px)',
                        }}
                    >
                        {post.author.name.charAt(0).toUpperCase()}
                    </Avatar>
                }
                action={
                    <Chip
                        label={categoryLabels[post.category as PostCategory] || 'Geral'}
                        size="small"
                        sx={{ height: 24, fontSize: '0.625rem', fontWeight: 500 }}
                    />
                }
                title={
                    <Typography variant="subtitle2" fontWeight={600} sx={{ filter: 'blur(4px)', userSelect: 'none' }}>
                        {post.author.name}
                    </Typography>
                }
                subheader={
                    <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(post.created_at)}
                    </Typography>
                }
                sx={{ pb: 1 }}
            />

            {/* Conteúdo */}
            {post.content && (
                <CardContent sx={{ pt: 0, pb: 1.5 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-line',
                            wordBreak: 'break-word',
                            filter: 'blur(4px)',
                            userSelect: 'none',
                        }}
                    >
                        {post.content}
                    </Typography>
                </CardContent>
            )}

            {/* Imagens - múltiplas */}
            {post.images && post.images.length > 1 && (
                <Box sx={{ mx: -2, pointerEvents: 'none' }}>
                    <ImageCarousel images={post.images} />
                </Box>
            )}

            {/* Imagem única */}
            {post.images && post.images.length === 1 && (
                <Box sx={{ mx: -2 }}>
                    <Box
                        component="img"
                        src={post.images[0]}
                        alt="Post image"
                        sx={{
                            width: '100%',
                            aspectRatio: '4/5',
                            maxHeight: 600,
                            objectFit: 'cover',
                            bgcolor: 'action.hover',
                        }}
                        loading="lazy"
                    />
                </Box>
            )}

            {/* Vídeo */}
            {post.video_url && (
                <Box sx={{ mx: 0 }}>
                    <Box
                        component="video"
                        src={`${post.video_url}#t=0.1`}
                        preload="metadata"
                        playsInline
                        sx={{
                            width: '100%',
                            maxHeight: '80vh',
                            objectFit: 'contain',
                            bgcolor: 'black',
                            pointerEvents: 'none',
                        }}
                    />
                </Box>
            )}

            {/* Actions ofuscadas */}
            <CardActions sx={{ px: 2, pt: 1.5, pointerEvents: 'none' }}>
                <Stack direction="row" spacing={2} sx={{ width: '100%', filter: 'blur(3px)' }}>
                    <IconButton size="small" disabled sx={{ p: 0.5 }}>
                        <FavoriteBorderIcon sx={{ fontSize: 26 }} />
                    </IconButton>
                    <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                        {post.likes_count}
                    </Typography>

                    <IconButton size="small" disabled sx={{ p: 0.5 }}>
                        <CommentIcon sx={{ fontSize: 26 }} />
                    </IconButton>
                    <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                        {post.comments_count}
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    <IconButton size="small" disabled sx={{ p: 0.5 }}>
                        <BookmarkBorderIcon sx={{ fontSize: 26 }} />
                    </IconButton>
                </Stack>
            </CardActions>
        </Card>
    );
}

/** Card CTA de assinatura que aparece no meio do feed */
function SubscribeCTA() {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 0,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >
            <Stack spacing={2} alignItems="center" sx={{ py: 5, px: 3, textAlign: 'center' }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <StarIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                    Desbloqueie a comunidade
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
                    Assine para interagir, curtir, comentar e acessar todo o conteúdo exclusivo da comunidade.
                </Typography>
                <Button
                    component={Link}
                    href="/dashboard/assinatura"
                    variant="contained"
                    size="large"
                    sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.2,
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        textTransform: 'none',
                    }}
                >
                    Assinar agora
                </Button>
            </Stack>
        </Card>
    );
}

export function ComunidadePreview() {
    const { posts, isLoading, isInitialized, fetchPosts } = usePosts();
    const { users: storyUsers } = useStories();

    React.useEffect(() => {
        if (!isInitialized) {
            fetchPosts(1);
        }
    }, [isInitialized, fetchPosts]);

    // Posição do CTA no meio do feed
    const ctaPosition = Math.min(2, posts.length);

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <Box
                sx={{
                    maxWidth: 672,
                    width: '100%',
                    pb: { xs: 12, sm: 4 },
                    bgcolor: 'background.paper',
                    minHeight: '100vh',
                    position: 'relative',
                }}
            >
                {/* Header Fixo */}
                <AppBar
                    position="fixed"
                    sx={{
                        width: { xs: '100%', md: 'calc(100% - 256px)' },
                    }}
                >
                    <Box sx={{ maxWidth: 672, mx: 'auto', width: '100%' }}>
                        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <DomeLogo style={{ fontSize: 18, fontWeight: 600 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Comunidade
                                </Typography>
                            </Stack>
                        </Toolbar>
                    </Box>
                </AppBar>

                <Toolbar />

                {/* Stories (blur leve) */}
                {storyUsers.length > 0 && (
                    <Box
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            py: 1.5,
                            bgcolor: 'background.paper',
                            filter: 'blur(5px)',
                            pointerEvents: 'none',
                        }}
                    >
                        <StoriesMui users={storyUsers} />
                    </Box>
                )}

                {/* Loading */}
                {isLoading && posts.length === 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* Feed rolável com posts reais ofuscados + CTA no meio */}
                <Stack spacing={0}>
                    {posts.map((post, index) => (
                        <React.Fragment key={post.id}>
                            {/* Inserir CTA no meio do feed */}
                            {index === ctaPosition && <SubscribeCTA />}
                            <BlurredRealPostCard post={post} />
                        </React.Fragment>
                    ))}

                    {/* Se tem poucos posts, CTA no final */}
                    {posts.length > 0 && posts.length <= ctaPosition && <SubscribeCTA />}

                    {/* Se não tem posts */}
                    {posts.length === 0 && !isLoading && <SubscribeCTA />}
                </Stack>

                {/* Botão flutuante "Assinar agora" */}
                <Zoom in={true}>
                    <Fab
                        component={Link}
                        href="/dashboard/assinatura"
                        variant="extended"
                        sx={{
                            position: 'fixed',
                            bottom: { xs: 80, sm: 24 },
                            right: { xs: 16, sm: 24 },
                            zIndex: 50,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 3,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                            },
                        }}
                    >
                        <StarIcon sx={{ mr: 1 }} />
                        Assinar agora
                    </Fab>
                </Zoom>
            </Box>
        </Box>
    );
}

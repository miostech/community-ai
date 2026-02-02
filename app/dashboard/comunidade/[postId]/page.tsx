'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { ImageCarousel } from '@/components/community/ImageCarousel';
import { CommentsSectionMui } from '@/components/community/CommentsSectionMui';
import { useSession } from 'next-auth/react';
import { useAccount } from '@/contexts/AccountContext';
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    Button,
    Chip,
    CircularProgress,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    AppBar,
    Toolbar,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    MoreVert as MoreVertIcon,
    Delete as DeleteIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    TextsmsOutlined as CommentIcon,
    BookmarkBorder as BookmarkIcon,
    Bookmark as BookmarkFilledIcon,
    OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral';

interface PostAuthor {
    id: string;
    name: string;
    avatar_url?: string;
}

interface Post {
    id: string;
    author: PostAuthor;
    content: string;
    images: string[];
    video_url?: string;
    link_instagram_post?: string;
    category: PostCategory;
    likes_count: number;
    comments_count: number;
    created_at: string;
    liked?: boolean;
    saved?: boolean;
}

const categoryLabels: Record<PostCategory, string> = {
    ideia: 'Ideia',
    resultado: 'Resultado',
    duvida: 'Dúvida',
    roteiro: 'Roteiro',
    geral: 'Geral',
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

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PostDetailPageMui() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { account } = useAccount();
    const postId = params.postId as string;

    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const fetchPost = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Post não encontrado');
                throw new Error('Erro ao carregar post');
            }
            const data = await response.json();
            setPost(data.post);
            setError(null);
        } catch (err) {
            console.error('Erro ao buscar post:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar post');
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        if (postId) {
            fetchPost();
        }
    }, [postId, fetchPost]);

    const handleLike = async () => {
        if (!post || !session?.user) return;
        const newLiked = !post.liked;
        setPost((prev) =>
            prev ? { ...prev, liked: newLiked, likes_count: newLiked ? prev.likes_count + 1 : prev.likes_count - 1 } : null
        );
        try {
            await fetch(`/api/posts/${postId}/like`, { method: newLiked ? 'POST' : 'DELETE' });
        } catch (err) {
            console.error('Erro ao dar like:', err);
            setPost((prev) =>
                prev ? { ...prev, liked: !newLiked, likes_count: !newLiked ? prev.likes_count + 1 : prev.likes_count - 1 } : null
            );
        }
    };

    const handleDoubleTap = () => {
        if (!post?.liked) handleLike();
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
    };

    const handleSave = async () => {
        if (!post || !session?.user) return;
        const newSaved = !post.saved;
        setPost((prev) => (prev ? { ...prev, saved: newSaved } : null));
        try {
            await fetch(`/api/posts/${postId}/save`, { method: newSaved ? 'POST' : 'DELETE' });
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setPost((prev) => (prev ? { ...prev, saved: !newSaved } : null));
        }
    };

    const handleCommentAdded = () => {
        setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));
    };

    const isMyPost = () => account?.id === post?.author.id;

    const handleDeletePost = async () => {
        if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) return;

        setIsDeletingPost(true);
        setMenuAnchorEl(null);

        try {
            const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao excluir post');
            }
            router.push('/dashboard/comunidade');
        } catch (error) {
            console.error('Erro ao excluir post:', error);
            alert('Erro ao excluir post. Tente novamente.');
            setIsDeletingPost(false);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !post) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Typography color="error" sx={{ mb: 2 }}>{error || 'Post não encontrado'}</Typography>
                <Button variant="contained" onClick={() => router.back()}>Voltar</Button>
            </Box>
        );
    }

    // const [isVerticalVideo, setIsVerticalVideo] = useState(false);

    // const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    //     const video = e.currentTarget;
    //     setIsVerticalVideo(video.videoHeight > video.videoWidth);
    // };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <AppBar sx={{ width: { xs: '100%', md: 'calc(100% - 256px)' } }}>
                <Toolbar sx={{ height: 67, minHeight: 67 }}>
                    <IconButton edge="start" onClick={() => router.back()} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>Post</Typography>
                    {isMyPost() && (
                        <>
                            <IconButton edge="end" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                                <MoreVertIcon />
                            </IconButton>
                            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
                                <MenuItem onClick={handleDeletePost} disabled={isDeletingPost} sx={{ color: 'error.main' }}>
                                    <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
                                    <ListItemText>{isDeletingPost ? 'Excluindo...' : 'Excluir post'}</ListItemText>
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 700, mx: 'auto', pt: '67px' }}>
                {/* Post */}
                <Paper elevation={0} sx={{ borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
                    {/* Author */}
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Link href={`/dashboard/comunidade/perfil/${post.author.id}`} style={{ textDecoration: 'none' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar src={post.author.avatar_url} sx={{ width: 44, height: 44 }}>
                                    {post.author.name.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={600} color="text.primary">{post.author.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{formatDate(post.created_at)}</Typography>
                                </Box>
                            </Stack>
                        </Link>
                        <Chip label={categoryLabels[post.category] || 'Geral'} size="small" variant="outlined" />
                    </Box>

                    {/* Content */}
                    {post.content && (
                        <Box sx={{ px: 2, pb: 2 }}>
                            <Typography sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{post.content}</Typography>
                        </Box>
                    )}

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                        <Box sx={{ position: 'relative' }} onDoubleClick={handleDoubleTap}>
                            {post.images.length > 1 ? (
                                <ImageCarousel images={post.images} />
                            ) : (
                                <Box component="img" src={post.images[0]} alt="Post" sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', bgcolor: 'action.hover' }} />
                            )}
                            {showHeartAnimation && (
                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
                                    <FavoriteIcon sx={{ fontSize: 100, color: 'error.main', animation: 'ping 0.8s ease-out', '@keyframes ping': { '0%': { transform: 'scale(0)', opacity: 1 }, '100%': { transform: 'scale(1.5)', opacity: 0 } } }} />
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Video */}
                    {post.video_url && (
                        // <Box sx={{ position: 'relative' }} onDoubleClick={handleDoubleTap}>
                        //     <video src={post.video_url} controls style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', backgroundColor: 'black' }} playsInline />
                        // </Box>
                        <Box
                            sx={{ mx: 0, cursor: 'pointer' }}
                        >
                            <Box
                                component="video"
                                src={`${post.video_url}#t=0.1`}
                                controls
                                preload="metadata"
                                playsInline
                                // onLoadedMetadata={handleVideoMetadata}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    width: '100%',
                                    aspectRatio: '9/16',
                                    objectFit: 'cover',
                                    bgcolor: 'black',
                                    maxHeight: "82vh",
                                }}
                            />
                        </Box>
                    )}

                    {/* Social Link */}
                    {post.link_instagram_post && (
                        <Box sx={{ px: 2, pb: 2 }}>
                            <Button href={post.link_instagram_post} target="_blank" rel="noopener" startIcon={<OpenInNewIcon />} size="small" color="primary">
                                {post.link_instagram_post.includes('instagram.com') ? 'Ver no Instagram' :
                                    post.link_instagram_post.includes('tiktok.com') ? 'Ver no TikTok' :
                                        post.link_instagram_post.includes('x.com') || post.link_instagram_post.includes('twitter.com') ? 'Ver no X' : 'Ver post original'}
                            </Button>
                        </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={2}>
                            <Button onClick={handleLike} startIcon={post.liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />} color={post.liked ? 'error' : 'inherit'} size="small">
                                {post.likes_count}
                            </Button>
                            <Button
                                startIcon={<CommentIcon />}
                                color="inherit"
                                size="small"
                                onClick={() => setIsCommentsOpen(true)}
                            >
                                {post.comments_count}
                            </Button>
                        </Stack>
                        <IconButton onClick={handleSave} size="small">
                            {post.saved ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                        </IconButton>
                    </Box>
                </Paper>

                {/* Botão para abrir comentários */}
                <Paper elevation={0} sx={{ borderRadius: 0, mb: { xs: 10, sm: 0 } }}>
                    <Button
                        fullWidth
                        onClick={() => setIsCommentsOpen(true)}
                        sx={{
                            py: 2,
                            justifyContent: 'flex-start',
                            px: 2,
                            borderRadius: 0,
                            textTransform: 'none',
                        }}
                    >
                        <CommentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography color="text.primary" fontWeight={500}>
                            Ver {post.comments_count} comentário{post.comments_count !== 1 ? 's' : ''}
                        </Typography>
                    </Button>
                </Paper>
            </Box>

            {/* Comments Drawer */}
            <CommentsSectionMui
                postId={postId}
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                onCommentAdded={handleCommentAdded}
            />
        </Box>
    );
}

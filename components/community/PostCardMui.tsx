'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Avatar,
    IconButton,
    Typography,
    Menu,
    MenuItem,
    Chip,
    Stack,
    CircularProgress,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    TextsmsOutlined as CommentIcon,
    BookmarkBorder as BookmarkBorderIcon,
    Bookmark as BookmarkIcon,
    MoreVert as MoreVertIcon,
    Delete as DeleteIcon,
    OpenInNew as OpenInNewIcon,
    PushPin as PushPinIcon,
} from '@mui/icons-material';
import { ImageCarousel } from './ImageCarousel';
import { Post } from '@/contexts/PostsContext';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral';

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

interface PostCardMuiProps {
    post: Post;
    isMyPost: boolean;
    onLike: () => void;
    onSave: () => void;
    onComment: () => void;
    onDelete: () => void;
    onNavigate: () => void;
    showHeartAnimation?: boolean;
    onDoubleTap: () => void;
    isDeleting?: boolean;
    /** Quando true, exibe a borda colorida de stories no avatar do autor */
    authorHasStories?: boolean;
    /** Admin pode fixar/desfixar qualquer post */
    isAdmin?: boolean;
    onPinToggle?: () => void;
    isTogglingPin?: boolean;
    /** Quando muda, o vídeo remonta (evita tela preta ao fechar comentários) */
    videoReloadTrigger?: number;
}

export function PostCardMui({
    post,
    isMyPost,
    onLike,
    onSave,
    onComment,
    onDelete,
    onNavigate,
    showHeartAnimation,
    onDoubleTap,
    isDeleting,
    authorHasStories = false,
    isAdmin = false,
    onPinToggle,
    isTogglingPin = false,
    videoReloadTrigger = 0,
}: PostCardMuiProps) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [isVerticalVideo, setIsVerticalVideo] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [videoRetryKey, setVideoRetryKey] = useState(0);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const videoErrorRef = useRef(false);
    videoErrorRef.current = videoError;

    const triggerVideoRetry = useCallback(() => {
        setVideoError(false);
        setVideoReady(false);
        setVideoRetryKey((k) => k + 1);
    }, []);

    // Só tenta de novo quando o vídeo volta à tela e havia erro (não remonta o vídeo ao entrar na visão)
    useEffect(() => {
        if (!post.video_url) return;
        const el = videoContainerRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && videoErrorRef.current) triggerVideoRetry();
            },
            { threshold: 0.1, rootMargin: '50px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [post.video_url, triggerVideoRetry]);

    const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        setIsVerticalVideo(video.videoHeight > video.videoWidth);
    };

    const handleVideoError = () => setVideoError(true);
    const handleVideoLoadedData = () => {
        setVideoReady(true);
        setVideoError(false);
    };

    /** Quando o vídeo falha e já está visível, tenta de novo após 1,5s. */
    useEffect(() => {
        if (!videoError) return;
        const t = setTimeout(triggerVideoRetry, 1500);
        return () => clearTimeout(t);
    }, [videoError, triggerVideoRetry]);


    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleDelete = () => {
        handleMenuClose();
        onDelete();
    };

    const getSocialLinkLabel = (url: string) => {
        if (url.includes('instagram.com')) return 'Ver post no Instagram';
        if (url.includes('tiktok.com')) return 'Ver post no TikTok';
        if (url.includes('x.com') || url.includes('twitter.com')) return 'Ver post no X';
        return 'Ver post original';
    };

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
                    <Link href={`/dashboard/comunidade/perfil/${post.author.id}`}>
                        {authorHasStories ? (
                            <Box
                                sx={{
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #facc15 0%, #ec4899 50%, #9333ea 100%)',
                                    p: '2px',
                                }}
                            >
                                <Box
                                    sx={{
                                        borderRadius: '50%',
                                        bgcolor: 'background.paper',
                                        p: '2px',
                                    }}
                                >
                                    <Avatar
                                        src={post.author.avatar_url}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                            cursor: 'pointer',
                                            '&:hover': { opacity: 0.9 },
                                        }}
                                    >
                                        {post.author.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                </Box>
                            </Box>
                        ) : (
                            <Avatar
                                src={post.author.avatar_url}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.9 },
                                }}
                            >
                                {post.author.name.charAt(0).toUpperCase()}
                            </Avatar>
                        )}
                    </Link>
                }
                action={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        {post.is_pinned ? (
                            <IconButton size="small" sx={{ color: 'text.secondary' }} aria-label="Post fixado">
                                <PushPinIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        ) : (
                            <Chip
                                label={categoryLabels[post.category] || 'Geral'}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.625rem',
                                    fontWeight: 500,
                                }}
                            />
                        )}
                        {(isMyPost || isAdmin) && (
                            <>
                                <IconButton size="small" onClick={handleMenuOpen}>
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                                <Menu
                                    anchorEl={menuAnchor}
                                    open={Boolean(menuAnchor)}
                                    onClose={handleMenuClose}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                >
                                    {isAdmin && onPinToggle && (
                                        <MenuItem
                                            onClick={() => {
                                                handleMenuClose();
                                                onPinToggle();
                                            }}
                                            disabled={isTogglingPin}
                                        >
                                            <ListItemIcon>
                                                {isTogglingPin ? (
                                                    <CircularProgress size={20} />
                                                ) : (
                                                    <PushPinIcon fontSize="small" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={isTogglingPin ? 'Salvando...' : post.is_pinned ? 'Desfixar post' : 'Fixar post'}
                                            />
                                        </MenuItem>
                                    )}
                                    {isMyPost && (
                                        <MenuItem onClick={handleDelete} disabled={isDeleting}>
                                            <ListItemIcon>
                                                {isDeleting ? (
                                                    <CircularProgress size={20} />
                                                ) : (
                                                    <DeleteIcon fontSize="small" color="error" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={isDeleting ? 'Excluindo...' : 'Excluir post'}
                                                primaryTypographyProps={{ color: 'error' }}
                                            />
                                        </MenuItem>
                                    )}
                                </Menu>
                            </>
                        )}
                    </Stack>
                }
                title={
                    <Link
                        href={`/dashboard/comunidade/perfil/${post.author.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{ '&:hover': { textDecoration: 'underline' } }}
                        >
                            {post.author.name}
                        </Typography>
                    </Link>
                }
                subheader={
                    <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(post.created_at)}
                    </Typography>
                }
                sx={{ pb: 1 }}
            />

            {/* Content */}
            {post.content && (
                <CardContent sx={{ pt: 0, pb: 1.5 }}>
                    <Typography
                        variant="body2"
                        onClick={onNavigate}
                        sx={{
                            cursor: 'pointer',
                            whiteSpace: 'pre-line',
                            wordBreak: 'break-word',
                            '&:hover': { color: 'text.secondary' },
                        }}
                    >
                        {post.content}
                    </Typography>
                </CardContent>
            )}

            {/* Imagens - múltiplas */}
            {post.images && post.images.length > 1 && (
                <Box
                    sx={{ position: 'relative', mx: -2 }}
                    onDoubleClick={onDoubleTap}
                >
                    <ImageCarousel images={post.images} />
                    {showHeartAnimation && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 10,
                            }}
                        >
                            <FavoriteIcon
                                sx={{
                                    fontSize: 96,
                                    color: 'white',
                                    filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.3))',
                                    animation: 'ping 1s ease-out',
                                    '@keyframes ping': {
                                        '0%': { transform: 'scale(0.8)', opacity: 1 },
                                        '100%': { transform: 'scale(1.5)', opacity: 0 },
                                    },
                                }}
                            />
                        </Box>
                    )}
                </Box>
            )}

            {/* Imagem única */}
            {post.images && post.images.length === 1 && (
                <Box
                    sx={{
                        position: 'relative',
                        mx: -2,
                        cursor: 'pointer',
                    }}
                    onClick={onNavigate}
                    onDoubleClick={onDoubleTap}
                >
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
                    {showHeartAnimation && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 10,
                            }}
                        >
                            <FavoriteIcon
                                sx={{
                                    fontSize: 96,
                                    color: 'white',
                                    filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.3))',
                                    animation: 'ping 1s ease-out',
                                }}
                            />
                        </Box>
                    )}
                </Box>
            )}

            {/* Vídeo */}
            {post.video_url && (
                <Box
                    ref={videoContainerRef}
                    sx={{ mx: 0, cursor: 'pointer', position: 'relative' }}
                    onClick={onNavigate}
                >
                    {videoError ? (
                        <Box
                            sx={{
                                width: '100%',
                                aspectRatio: isVerticalVideo ? '9/16' : '16/9',
                                maxHeight: '80vh',
                                bgcolor: 'black',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CircularProgress size={32} sx={{ color: 'grey.500' }} />
                        </Box>
                    ) : (
                        <>
                            <Box
                                component="video"
                                key={`${videoRetryKey}-${videoReloadTrigger}`}
                                src={`${post.video_url}#t=0.1`}
                                controls
                                preload="metadata"
                                playsInline
                                onLoadedMetadata={handleVideoMetadata}
                                onLoadedData={handleVideoLoadedData}
                                onError={handleVideoError}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    width: '100%',
                                    aspectRatio: isVerticalVideo ? '9/16' : '16/9',
                                    maxHeight: '80vh',
                                    objectFit: isVerticalVideo ? 'cover' : 'contain',
                                    bgcolor: 'black',
                                }}
                            />
                            {!videoReady && !videoError && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'black',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <CircularProgress size={32} sx={{ color: 'grey.500' }} />
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            )}

            {/* Link social */}
            {post.link_instagram_post && (
                <CardContent sx={{ py: 1 }}>
                    <Typography
                        component="a"
                        href={post.link_instagram_post}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        color="primary"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                        {getSocialLinkLabel(post.link_instagram_post)}
                    </Typography>
                </CardContent>
            )}

            {/* Actions */}
            <CardActions sx={{ px: 2, pt: 1.5 }}>
                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    <IconButton
                        onClick={onLike}
                        size="small"
                        sx={{
                            color: post.liked ? 'error.main' : 'text.primary',
                            p: 0.5,
                        }}
                    >
                        {post.liked ? (
                            <FavoriteIcon sx={{ fontSize: 26 }} />
                        ) : (
                            <FavoriteBorderIcon sx={{ fontSize: 26 }} />
                        )}
                    </IconButton>
                    <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                        {post.likes_count}
                    </Typography>

                    <IconButton onClick={onComment} size="small" sx={{ p: 0.5 }}>
                        <CommentIcon sx={{ fontSize: 26 }} />
                    </IconButton>
                    <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                        {post.comments_count}
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    <IconButton
                        onClick={onSave}
                        size="small"
                        sx={{
                            color: post.saved ? 'primary.main' : 'text.primary',
                            p: 0.5,
                        }}
                    >
                        {post.saved ? (
                            <BookmarkIcon sx={{ fontSize: 26 }} />
                        ) : (
                            <BookmarkBorderIcon sx={{ fontSize: 26 }} />
                        )}
                    </IconButton>
                </Stack>
            </CardActions>
        </Card>
    );
}

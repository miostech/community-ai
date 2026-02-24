'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Drawer,
    Box,
    Typography,
    Avatar,
    IconButton,
    TextField,
    Button,
    Stack,
    CircularProgress,
    Divider,
    Collapse,
    Paper,
    List,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Popper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
} from '@mui/material';
import {
    Close as CloseIcon,
    TextsmsOutlined as ChatIcon,
    Delete as DeleteIcon,
    Reply as ReplyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Send as SendIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';

interface CommentAuthor {
    id: string;
    name: string;
    avatar_url?: string;
    role?: 'user' | 'moderator' | 'admin' | 'criador';
}

interface Reply {
    _id: string;
    author: CommentAuthor;
    content: string;
    created_at: string;
    likes_count?: number;
    liked?: boolean;
    mentions?: Record<string, string>;
    moderation_status?: 'pending' | 'approved';
}

interface Comment {
    _id: string;
    author: CommentAuthor;
    content: string;
    created_at: string;
    likes_count?: number;
    liked?: boolean;
    replies_count?: number;
    replies?: Reply[];
    mentions?: Record<string, string>;
    moderation_status?: 'pending' | 'approved';
}

interface CommentsSectionMuiProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
    onCommentAdded?: () => void;
}

interface ReplyingTo {
    commentId: string;
    authorName: string;
}

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

const quickEmojis = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

/** Renderiza conteúdo de comentário com @handle destacado e clique para ir ao perfil. */
function CommentContent({ content, mentions }: { content: string; mentions?: Record<string, string> }) {
    const router = useRouter();
    const parts = content.split(/(@[a-zA-Z0-9_.]+)/g);

    const handleMentionClick = useCallback(
        (e: React.MouseEvent, userId: string) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/dashboard/comunidade/perfil/${userId}`);
        },
        [router]
    );

    return (
        <>
            {parts.map((part, i) => {
                if (!part.startsWith('@')) return <span key={i}>{part}</span>;
                const handle = part.slice(1).toLowerCase();
                const userId = mentions?.[handle];
                if (!userId) {
                    return (
                        <Box key={i} component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                            {part}
                        </Box>
                    );
                }
                return (
                    <Box
                        key={i}
                        component="span"
                        role="link"
                        tabIndex={0}
                        sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': { opacity: 0.9 },
                        }}
                        onClick={(e) => handleMentionClick(e, userId)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleMentionClick(e as unknown as React.MouseEvent, userId);
                            }
                        }}
                    >
                        {part}
                    </Box>
                );
            })}
        </>
    );
}

interface MentionUser {
    id: string;
    name: string;
    handle: string;
}

export function CommentsSectionMui({ postId, isOpen, onClose, onCommentAdded }: CommentsSectionMuiProps) {
    const router = useRouter();
    const { account } = useAccount();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
    const [mentionUsersLoading, setMentionUsersLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ commentId: string; isReply: boolean; parentId?: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingComment, setEditingComment] = useState<{
        id: string;
        isReply: boolean;
        parentId?: string;
        content: string;
    } | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [viewerIsModerator, setViewerIsModerator] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [showPendingNotice, setShowPendingNotice] = useState(false);
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const bottomBarRef = useRef<HTMLDivElement>(null);

    // Query para autocomplete: texto após o último @ (sem espaços no meio)
    const lastAtIndex = commentText.lastIndexOf('@');
    const afterAt = lastAtIndex >= 0 ? commentText.slice(lastAtIndex + 1) : '';
    const mentionQuery = afterAt.split(/\s/)[0] ?? '';
    const showMentionDropdown = lastAtIndex >= 0 && !afterAt.includes(' ');

    // Usuários filtrados pelo que foi digitado após @
    const filteredMentionUsers = mentionQuery
        ? mentionUsers.filter(
              (u) =>
                  u.handle.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                  u.name.toLowerCase().includes(mentionQuery.toLowerCase())
          )
        : mentionUsers;

    // Buscar comentários da API
    const fetchComments = useCallback(async () => {
        if (!postId) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/posts/${postId}/comments`);

            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
                setViewerIsModerator(!!data.viewerIsModerator);
            }
        } catch (error) {
            console.error('Erro ao buscar comentários:', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    // Buscar comentários quando abrir o modal
    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
        }
    }, [isOpen, postId, fetchComments]);

    // Buscar lista de usuários para menção quando abrir o drawer
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setMentionUsersLoading(true);
        fetch('/api/community/mention-users', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : { users: [] }))
            .then((data) => {
                if (!cancelled && Array.isArray(data.users)) {
                    setMentionUsers(data.users);
                }
            })
            .catch(() => {
                if (!cancelled) setMentionUsers([]);
            })
            .finally(() => {
                if (!cancelled) setMentionUsersLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    // Colar a barra de input ao teclado no mobile (eliminar vão transparente)
    useEffect(() => {
        if (!isOpen) {
            setKeyboardOffset(0);
            return;
        }
        const updateOffset = () => {
            if (typeof window === 'undefined' || !window.visualViewport) return;
            const vv = window.visualViewport;
            const offset = window.innerHeight - vv.height - vv.offsetTop;
            setKeyboardOffset(offset > 10 ? offset : 0);
        };
        updateOffset();
        window.visualViewport?.addEventListener('resize', updateOffset);
        window.visualViewport?.addEventListener('scroll', updateOffset);
        return () => {
            window.visualViewport?.removeEventListener('resize', updateOffset);
            window.visualViewport?.removeEventListener('scroll', updateOffset);
        };
    }, [isOpen]);

    const insertMention = useCallback((handle: string) => {
        if (lastAtIndex < 0) return;
        const before = commentText.slice(0, lastAtIndex);
        const after = commentText.slice(lastAtIndex + 1 + mentionQuery.length);
        setCommentText(before + '@' + handle + ' ' + after);
        inputRef.current?.focus();
    }, [commentText, lastAtIndex, mentionQuery]);

    // Enviar comentário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: commentText.trim(),
                    parent_id: replyingTo?.commentId || undefined,
                }),
            });

            if (response.ok) {
                const data = await response.json();

                if (replyingTo) {
                    setComments(prev =>
                        prev.map(comment => {
                            if (comment._id === replyingTo.commentId) {
                                return {
                                    ...comment,
                                    replies_count: (comment.replies_count || 0) + 1,
                                    replies: [...(comment.replies || []), data.comment],
                                };
                            }
                            return comment;
                        })
                    );
                    setExpandedReplies(prev => new Set(prev).add(replyingTo.commentId));
                    setReplyingTo(null);
                } else {
                    setComments(prev => [{ ...data.comment, replies: [] }, ...prev]);
                }
                if (data.comment?.moderation_status === 'pending') {
                    setShowPendingNotice(true);
                    setTimeout(() => setShowPendingNotice(false), 6000);
                }

                setCommentText('');
                onCommentAdded?.();

                if (!replyingTo) {
                    setTimeout(() => {
                        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = (commentId: string, authorName: string) => {
        setReplyingTo({ commentId, authorName });
        setCommentText('');
        inputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setCommentText('');
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const handleDeleteCommentClick = (commentId: string, isReply: boolean = false, parentId?: string) => {
        setDeleteConfirm({ commentId, isReply, parentId });
    };

    const handleDeleteCommentConfirm = async () => {
        if (!deleteConfirm) return;
        const { commentId, isReply, parentId } = deleteConfirm;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                if (isReply && parentId) {
                    setComments(prev =>
                        prev.map(comment => {
                            if (comment._id === parentId) {
                                return {
                                    ...comment,
                                    replies_count: Math.max(0, (comment.replies_count || 0) - 1),
                                    replies: comment.replies?.filter(r => r._id !== commentId) || [],
                                };
                            }
                            return comment;
                        })
                    );
                } else {
                    setComments(prev => prev.filter(c => c._id !== commentId));
                }
                onCommentAdded?.();
                setDeleteConfirm(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Erro ao deletar comentário');
            }
        } catch (error) {
            console.error('Erro ao deletar comentário:', error);
            alert('Erro ao deletar comentário');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStartEdit = (commentId: string, content: string, isReply: boolean = false, parentId?: string) => {
        setEditingComment({ id: commentId, isReply, parentId, content });
    };

    const handleCancelEdit = () => {
        setEditingComment(null);
    };

    const handleSaveEdit = async () => {
        if (!editingComment || !editingComment.content.trim() || isSavingEdit) return;
        setIsSavingEdit(true);
        try {
            const response = await fetch(
                `/api/posts/${postId}/comments?commentId=${editingComment.id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: editingComment.content.trim() }),
                }
            );
            if (response.ok) {
                const data = await response.json();
                const updated = data.comment;
                if (editingComment.isReply && editingComment.parentId) {
                    setComments(prev =>
                        prev.map(comment => {
                            if (comment._id === editingComment.parentId) {
                                return {
                                    ...comment,
                                    replies: comment.replies?.map(r =>
                                        r._id === editingComment.id
                                            ? {
                                                  ...r,
                                                  content: updated.content,
                                                  mentions: updated.mentions,
                                              }
                                            : r
                                    ) || [],
                                };
                            }
                            return comment;
                        })
                    );
                } else {
                    setComments(prev =>
                        prev.map(c =>
                            c._id === editingComment.id
                                ? { ...c, content: updated.content, mentions: updated.mentions }
                                : c
                        )
                    );
                }
                setEditingComment(null);
                onCommentAdded?.();
            } else {
                const data = await response.json();
                alert(data.error || 'Erro ao editar comentário');
            }
        } catch (error) {
            console.error('Erro ao editar comentário:', error);
            alert('Erro ao editar comentário');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleApproveComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        if (!viewerIsModerator || approvingId) return;
        setApprovingId(commentId);
        try {
            const response = await fetch(
                `/api/posts/${postId}/comments?commentId=${commentId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'approve' }),
                }
            );
            if (response.ok) {
                if (isReply && parentId) {
                    setComments(prev =>
                        prev.map(c => {
                            if (c._id !== parentId) return c;
                            return {
                                ...c,
                                replies: c.replies?.map(r =>
                                    r._id === commentId ? { ...r, moderation_status: 'approved' as const } : r
                                ) || [],
                            };
                        })
                    );
                } else {
                    setComments(prev =>
                        prev.map(c =>
                            c._id === commentId ? { ...c, moderation_status: 'approved' as const } : c
                        )
                    );
                }
                onCommentAdded?.();
            }
        } catch (e) {
            console.error('Erro ao aprovar comentário:', e);
        } finally {
            setApprovingId(null);
        }
    };

    const isMyComment = (authorId: string) => {
        return account?.id === authorId;
    };

    const goToProfile = (userId: string) => {
        router.push(`/dashboard/comunidade/perfil/${userId}`);
    };

    const addEmoji = (emoji: string) => {
        setCommentText(prev => prev + emoji);
        inputRef.current?.focus();
    };

    // Like em comentário
    const handleLikeComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        try {
            // Atualização otimista
            if (isReply && parentId) {
                setComments(prev =>
                    prev.map(comment => {
                        if (comment._id === parentId) {
                            return {
                                ...comment,
                                replies: comment.replies?.map(reply => {
                                    if (reply._id === commentId) {
                                        const newLiked = !reply.liked;
                                        return {
                                            ...reply,
                                            liked: newLiked,
                                            likes_count: newLiked
                                                ? (reply.likes_count || 0) + 1
                                                : Math.max(0, (reply.likes_count || 0) - 1),
                                        };
                                    }
                                    return reply;
                                }),
                            };
                        }
                        return comment;
                    })
                );
            } else {
                setComments(prev =>
                    prev.map(comment => {
                        if (comment._id === commentId) {
                            const newLiked = !comment.liked;
                            return {
                                ...comment,
                                liked: newLiked,
                                likes_count: newLiked
                                    ? (comment.likes_count || 0) + 1
                                    : Math.max(0, (comment.likes_count || 0) - 1),
                            };
                        }
                        return comment;
                    })
                );
            }

            // Chamar API
            const response = await fetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
            });

            if (!response.ok) {
                // Reverter em caso de erro
                if (isReply && parentId) {
                    setComments(prev =>
                        prev.map(comment => {
                            if (comment._id === parentId) {
                                return {
                                    ...comment,
                                    replies: comment.replies?.map(reply => {
                                        if (reply._id === commentId) {
                                            const newLiked = !reply.liked;
                                            return {
                                                ...reply,
                                                liked: newLiked,
                                                likes_count: newLiked
                                                    ? (reply.likes_count || 0) + 1
                                                    : Math.max(0, (reply.likes_count || 0) - 1),
                                            };
                                        }
                                        return reply;
                                    }),
                                };
                            }
                            return comment;
                        })
                    );
                } else {
                    setComments(prev =>
                        prev.map(comment => {
                            if (comment._id === commentId) {
                                const newLiked = !comment.liked;
                                return {
                                    ...comment,
                                    liked: newLiked,
                                    likes_count: newLiked
                                        ? (comment.likes_count || 0) + 1
                                        : Math.max(0, (comment.likes_count || 0) - 1),
                                };
                            }
                            return comment;
                        })
                    );
                }
            }
        } catch (error) {
            console.error('Erro ao dar like no comentário:', error);
        }
    };

    const userName = account?.first_name || 'U';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <>
        <Drawer
            anchor="bottom"
            open={isOpen}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: '24px 24px 0 0',
                    maxHeight: '85vh',
                    height: '85vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {/* Handle para arrastar */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    pt: 1.5,
                    pb: 1,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 5,
                        borderRadius: 2.5,
                        bgcolor: 'divider',
                    }}
                />
            </Box>

            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    px: 2,
                }}
            >
                <Typography variant="subtitle1" fontWeight={600}>
                    Comentários
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Divider />

            {/* Lista de comentários */}
            <Box
                ref={scrollContainerRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: 2,
                    py: 2,
                }}
            >
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : comments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <ChatIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Nenhum comentário ainda
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            Seja o primeiro a comentar!
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {comments.map((comment) => (
                            <Box key={comment._id}>
                                {/* Comentário principal */}
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={() => goToProfile(comment.author.id)}
                                        sx={{
                                            p: 0,
                                            m: 0,
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            lineHeight: 0,
                                        }}
                                    >
                                        <Avatar
                                            src={comment.author.avatar_url}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                                fontSize: '0.875rem',
                                                '&:hover': { opacity: 0.9 },
                                            }}
                                        >
                                            {comment.author.name.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Box>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                bgcolor: 'action.hover',
                                                borderRadius: 3,
                                                px: 2,
                                                pt: 0.5,
                                                pb: 1.5,
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                                                <Typography
                                                    component="button"
                                                    type="button"
                                                    variant="body2"
                                                    fontWeight={600}
                                                    onClick={() => goToProfile(comment.author.id)}
                                                    sx={{
                                                        p: 0,
                                                        m: 0,
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        '&:hover': { textDecoration: 'underline' },
                                                    }}
                                                >
                                                    {comment.author.name}
                                                </Typography>
                                                {(comment.author.role === 'moderator' || comment.author.role === 'admin' || comment.author.role === 'criador') && (
                                                    <Tooltip
                                                        title={
                                                            comment.author.role === 'admin'
                                                                ? 'Administrador(a) Dome'
                                                                : comment.author.role === 'moderator'
                                                                    ? 'Moderador(a) Dome'
                                                                    : 'Criador(a) Dome'
                                                        }
                                                        arrow
                                                        placement="top"
                                                        enterDelay={300}
                                                        leaveDelay={0}
                                                        enterTouchDelay={0}
                                                    >
                                                        <Box
                                                            component="span"
                                                            tabIndex={0}
                                                            role="img"
                                                            aria-label={
                                                                comment.author.role === 'admin'
                                                                    ? 'Administrador(a) Dome'
                                                                    : comment.author.role === 'moderator'
                                                                        ? 'Moderador(a) Dome'
                                                                        : 'Criador(a) Dome'
                                                            }
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                cursor: 'help',
                                                                outline: 'none',
                                                                '&:focus-visible': { opacity: 0.9 },
                                                            }}
                                                        >
                                                            <Box
                                                                component="img"
                                                                src={comment.author.role === 'admin' ? '/moderador.png' : comment.author.role === 'moderator' ? '/coroa.png' : '/verificado.png'}
                                                                alt=""
                                                                sx={{ width: 14, height: 14, verticalAlign: 'middle', pointerEvents: 'none' }}
                                                            />
                                                        </Box>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                            {editingComment?.id === comment._id && !editingComment.isReply ? (
                                                <Box sx={{ mt: 1 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        multiline
                                                        minRows={2}
                                                        value={editingComment.content}
                                                        onChange={(e) =>
                                                            setEditingComment(prev =>
                                                                prev ? { ...prev, content: e.target.value } : null
                                                            )
                                                        }
                                                        placeholder="Editar comentário..."
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
                                                        autoFocus
                                                    />
                                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            onClick={handleSaveEdit}
                                                            disabled={!editingComment.content.trim() || isSavingEdit}
                                                        >
                                                            {isSavingEdit ? <CircularProgress size={16} /> : 'Salvar'}
                                                        </Button>
                                                        <Button size="small" onClick={handleCancelEdit} disabled={isSavingEdit}>
                                                            Cancelar
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            ) : (
                                                <Typography
                                                    variant="body2"
                                                    sx={{ wordBreak: 'break-word', mt: 0.25 }}
                                                >
                                                    <CommentContent content={comment.content} mentions={comment.mentions} />
                                                </Typography>
                                            )}
                                            {comment.moderation_status === 'pending' && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    Aguardando moderação
                                                </Typography>
                                            )}
                                        </Box>

                                        <Stack direction="row" spacing={2} sx={{ mt: 0.75, pl: 1.5 }} alignItems="center" flexWrap="wrap">
                                            <Typography variant="caption" color="text.secondary">
                                                {formatTimeAgo(comment.created_at)}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleLikeComment(comment._id)}
                                                sx={{
                                                    p: 0.25,
                                                    color: comment.liked ? 'error.main' : 'text.secondary',
                                                    '&:hover': { color: 'error.main' },
                                                }}
                                            >
                                                {comment.liked ? (
                                                    <FavoriteIcon sx={{ fontSize: '0.875rem' }} />
                                                ) : (
                                                    <FavoriteBorderIcon sx={{ fontSize: '0.875rem' }} />
                                                )}
                                            </IconButton>
                                            {(comment.likes_count || 0) > 0 && (
                                                <Typography
                                                    variant="caption"
                                                    color={comment.liked ? 'error.main' : 'text.secondary'}
                                                    fontWeight={600}
                                                    sx={{ ml: -1.5 }}
                                                >
                                                    {comment.likes_count}
                                                </Typography>
                                            )}
                                            <Button
                                                size="small"
                                                onClick={() => handleReply(comment._id, comment.author.name)}
                                                sx={{
                                                    p: 0,
                                                    minWidth: 'auto',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                }}
                                            >
                                                Responder
                                            </Button>
                                            {viewerIsModerator && comment.moderation_status === 'pending' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleApproveComment(comment._id, false)}
                                                    disabled={approvingId === comment._id}
                                                    sx={{
                                                        p: 0,
                                                        minWidth: 'auto',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    {approvingId === comment._id ? <CircularProgress size={14} /> : 'Aprovar'}
                                                </Button>
                                            )}
                                            {isMyComment(comment.author.id) && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            handleStartEdit(comment._id, comment.content, false)
                                                        }
                                                        disabled={!!editingComment}
                                                        sx={{
                                                            p: 0,
                                                            minWidth: 'auto',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            textTransform: 'none',
                                                        }}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteCommentClick(comment._id)}
                                                        sx={{
                                                            p: 0,
                                                            minWidth: 'auto',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            textTransform: 'none',
                                                        }}
                                                    >
                                                        Excluir
                                                    </Button>
                                                </>
                                            )}
                                            {viewerIsModerator && !isMyComment(comment.author.id) && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteCommentClick(comment._id)}
                                                    sx={{
                                                        p: 0,
                                                        minWidth: 'auto',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    Excluir
                                                </Button>
                                            )}
                                        </Stack>

                                        {/* Ver respostas */}
                                        {(comment.replies_count || 0) > 0 && (
                                            <Button
                                                size="small"
                                                onClick={() => toggleReplies(comment._id)}
                                                startIcon={
                                                    expandedReplies.has(comment._id) ? (
                                                        <ExpandLessIcon fontSize="small" />
                                                    ) : (
                                                        <ExpandMoreIcon fontSize="small" />
                                                    )
                                                }
                                                sx={{
                                                    mt: 1,
                                                    ml: 1.5,
                                                    textTransform: 'none',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {expandedReplies.has(comment._id)
                                                    ? 'Ocultar respostas'
                                                    : `Ver ${comment.replies_count} resposta${(comment.replies_count || 0) > 1 ? 's' : ''}`}
                                            </Button>
                                        )}

                                        {/* Lista de replies */}
                                        <Collapse in={expandedReplies.has(comment._id)}>
                                            {comment.replies && comment.replies.length > 0 && (
                                                <Stack spacing={1.5} sx={{ mt: 1.5, pl: 1 }}>
                                                    {comment.replies.map((reply) => (
                                                        <Stack key={reply._id} direction="row" spacing={1} alignItems="flex-start">
                                                            <Box
                                                                component="button"
                                                                type="button"
                                                                onClick={() => goToProfile(reply.author.id)}
                                                                sx={{
                                                                    p: 0,
                                                                    m: 0,
                                                                    border: 'none',
                                                                    background: 'none',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0,
                                                                    lineHeight: 0,
                                                                }}
                                                            >
                                                                <Avatar
                                                                    src={reply.author.avatar_url}
                                                                    sx={{
                                                                        width: 28,
                                                                        height: 28,
                                                                        background: 'linear-gradient(135deg, #4ade80 0%, #3b82f6 100%)',
                                                                        fontSize: '0.75rem',
                                                                        '&:hover': { opacity: 0.9 },
                                                                    }}
                                                                >
                                                                    {reply.author.name.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                            </Box>

                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Box
                                                                    sx={{
                                                                        bgcolor: 'action.selected',
                                                                        borderRadius: 2,
                                                                        px: 1.5,
                                                                        pt: 0.25,
                                                                        pb: 1,
                                                                    }}
                                                                >
                                                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                                                                        <Typography
                                                                            component="button"
                                                                            type="button"
                                                                            variant="caption"
                                                                            fontWeight={600}
                                                                            onClick={() => goToProfile(reply.author.id)}
                                                                            sx={{
                                                                                p: 0,
                                                                                m: 0,
                                                                                border: 'none',
                                                                                background: 'none',
                                                                                cursor: 'pointer',
                                                                                textAlign: 'left',
                                                                                display: 'block',
                                                                                '&:hover': { textDecoration: 'underline' },
                                                                            }}
                                                                        >
                                                                            {reply.author.name}
                                                                        </Typography>
                                                                        {(reply.author.role === 'moderator' || reply.author.role === 'admin' || reply.author.role === 'criador') && (
                                                                            <Tooltip
                                                                                title={
                                                                                    reply.author.role === 'admin'
                                                                                        ? 'Administrador(a) Dome'
                                                                                        : reply.author.role === 'moderator'
                                                                                            ? 'Moderador(a) Dome'
                                                                                            : 'Criador(a) Dome'
                                                                                }
                                                                                arrow
                                                                                placement="top"
                                                                                enterDelay={300}
                                                                                leaveDelay={0}
                                                                                enterTouchDelay={0}
                                                                            >
                                                                                <Box
                                                                                    component="span"
                                                                                    tabIndex={0}
                                                                                    role="img"
                                                                                    aria-label={
                                                                                        reply.author.role === 'admin'
                                                                                            ? 'Administrador(a) Dome'
                                                                                            : reply.author.role === 'moderator'
                                                                                                ? 'Moderador(a) Dome'
                                                                                                : 'Criador(a) Dome'
                                                                                    }
                                                                                    sx={{
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        cursor: 'help',
                                                                                        outline: 'none',
                                                                                        '&:focus-visible': { opacity: 0.9 },
                                                                                    }}
                                                                                >
                                                                                    <Box
                                                                                        component="img"
                                                                                        src={reply.author.role === 'admin' ? '/moderador.png' : reply.author.role === 'moderator' ? '/coroa.png' : '/verificado.png'}
                                                                                        alt=""
                                                                                        sx={{ width: 12, height: 12, verticalAlign: 'middle', pointerEvents: 'none' }}
                                                                                />
                                                                                </Box>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Stack>
                                                                    {editingComment?.id === reply._id && editingComment.isReply ? (
                                                                        <Box sx={{ mt: 0.75 }}>
                                                                            <TextField
                                                                                fullWidth
                                                                                size="small"
                                                                                multiline
                                                                                minRows={1}
                                                                                value={editingComment.content}
                                                                                onChange={(e) =>
                                                                                    setEditingComment(prev =>
                                                                                        prev ? { ...prev, content: e.target.value } : null
                                                                                    )
                                                                                }
                                                                                placeholder="Editar resposta..."
                                                                                sx={{
                                                                                    '& .MuiInputBase-root': { bgcolor: 'background.paper' },
                                                                                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                                                                                }}
                                                                                autoFocus
                                                                            />
                                                                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                                                                <Button
                                                                                    size="small"
                                                                                    variant="contained"
                                                                                    onClick={handleSaveEdit}
                                                                                    disabled={!editingComment.content.trim() || isSavingEdit}
                                                                                    sx={{ fontSize: '0.6875rem' }}
                                                                                >
                                                                                    {isSavingEdit ? <CircularProgress size={14} /> : 'Salvar'}
                                                                                </Button>
                                                                                <Button
                                                                                    size="small"
                                                                                    onClick={handleCancelEdit}
                                                                                    disabled={isSavingEdit}
                                                                                    sx={{ fontSize: '0.6875rem' }}
                                                                                >
                                                                                    Cancelar
                                                                                </Button>
                                                                            </Stack>
                                                                        </Box>
                                                                    ) : (
                                                                        <Typography
                                                                            variant="caption"
                                                                            display="block"
                                                                            sx={{ wordBreak: 'break-word' }}
                                                                        >
                                                                            <CommentContent content={reply.content} mentions={reply.mentions} />
                                                                        </Typography>
                                                                    )}
                                                                    {reply.moderation_status === 'pending' && (
                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.65rem' }}>
                                                                            Aguardando moderação
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                                <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, pl: 1 }} alignItems="center" flexWrap="wrap">
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                                                                        {formatTimeAgo(reply.created_at)}
                                                                    </Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleLikeComment(reply._id, true, comment._id)}
                                                                        sx={{
                                                                            p: 0.25,
                                                                            color: reply.liked ? 'error.main' : 'text.secondary',
                                                                            '&:hover': { color: 'error.main' },
                                                                        }}
                                                                    >
                                                                        {reply.liked ? (
                                                                            <FavoriteIcon sx={{ fontSize: '0.75rem' }} />
                                                                        ) : (
                                                                            <FavoriteBorderIcon sx={{ fontSize: '0.75rem' }} />
                                                                        )}
                                                                    </IconButton>
                                                                    {(reply.likes_count || 0) > 0 && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            color={reply.liked ? 'error.main' : 'text.secondary'}
                                                                            fontWeight={600}
                                                                            sx={{ ml: -1, fontSize: '0.6875rem' }}
                                                                        >
                                                                            {reply.likes_count}
                                                                        </Typography>
                                                                    )}
                                                                    {viewerIsModerator && reply.moderation_status === 'pending' && (
                                                                        <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            color="primary"
                                                                            onClick={() => handleApproveComment(reply._id, true, comment._id)}
                                                                            disabled={approvingId === reply._id}
                                                                            sx={{
                                                                                p: 0,
                                                                                minWidth: 'auto',
                                                                                fontSize: '0.6875rem',
                                                                                fontWeight: 600,
                                                                                textTransform: 'none',
                                                                            }}
                                                                        >
                                                                            {approvingId === reply._id ? <CircularProgress size={12} /> : 'Aprovar'}
                                                                        </Button>
                                                                    )}
                                                                    {isMyComment(reply.author.id) && (
                                                                        <>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() =>
                                                                                    handleStartEdit(
                                                                                        reply._id,
                                                                                        reply.content,
                                                                                        true,
                                                                                        comment._id
                                                                                    )
                                                                                }
                                                                                disabled={!!editingComment}
                                                                                sx={{
                                                                                    p: 0,
                                                                                    minWidth: 'auto',
                                                                                    fontSize: '0.6875rem',
                                                                                    fontWeight: 600,
                                                                                    textTransform: 'none',
                                                                                }}
                                                                            >
                                                                                Editar
                                                                            </Button>
                                                                            <Button
                                                                                size="small"
                                                                                color="error"
                                                                                onClick={() => handleDeleteCommentClick(reply._id, true, comment._id)}
                                                                                sx={{
                                                                                    p: 0,
                                                                                    minWidth: 'auto',
                                                                                    fontSize: '0.6875rem',
                                                                                    fontWeight: 600,
                                                                                    textTransform: 'none',
                                                                                }}
                                                                            >
                                                                                Excluir
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    {viewerIsModerator && !isMyComment(reply.author.id) && (
                                                                        <Button
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => handleDeleteCommentClick(reply._id, true, comment._id)}
                                                                            sx={{
                                                                                p: 0,
                                                                                minWidth: 'auto',
                                                                                fontSize: '0.6875rem',
                                                                                fontWeight: 600,
                                                                                textTransform: 'none',
                                                                            }}
                                                                        >
                                                                            Excluir
                                                                        </Button>
                                                                    )}
                                                                </Stack>
                                                            </Box>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Collapse>
                                    </Box>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Indicador de resposta */}
            {replyingTo && (
                <Box
                    sx={{
                        bgcolor: 'action.hover',
                        borderTop: 1,
                        borderColor: 'divider',
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Respondendo a{' '}
                        <Typography component="span" fontWeight={600} color="text.primary">
                            {replyingTo.authorName}
                        </Typography>
                    </Typography>
                    <IconButton size="small" onClick={cancelReply}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            {/* Espaçador quando teclado aberto (evita lista ficar atrás da barra fixa) */}
            {keyboardOffset > 0 && <Box sx={{ minHeight: 160, flexShrink: 0 }} />}

            {/* Barra de emojis + campo de entrada (fixa no topo do teclado quando aberto) */}
            <Box
                ref={bottomBarRef}
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    flexShrink: 0,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
                    ...(keyboardOffset > 0 && {
                        position: 'fixed' as const,
                        left: 0,
                        right: 0,
                        bottom: keyboardOffset,
                        zIndex: 1300,
                        borderRadius: '24px 24px 0 0',
                    }),
                }}
            >
            {/* Barra de emojis */}
            <Box
                sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    px: 1.5,
                    py: 1,
                    display: 'flex',
                    gap: 0.5,
                    overflowX: 'auto',
                    backgroundColor: 'background.paper',
                }}
            >
                {quickEmojis.map((emoji, index) => (
                    <IconButton
                        key={index}
                        onClick={() => addEmoji(emoji)}
                        size="small"
                        sx={{ fontSize: '1.5rem' }}
                    >
                        {emoji}
                    </IconButton>
                ))}
            </Box>

            {/* Campo de entrada */}
            <Box
                sx={{
                    borderTop: 2,
                    borderColor: 'divider',
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {showPendingNotice && (
                    <Box
                        sx={{
                            py: 0.75,
                            px: 1.5,
                            borderRadius: 1,
                            bgcolor: 'action.selected',
                            border: '1px solid',
                            borderColor: 'primary.main',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Seu comentário está em análise e será exibido após aprovação de um moderador.
                        </Typography>
                    </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                    sx={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        boxShadow: 1,
                    }}
                >
                    {userInitial}
                </Avatar>

                <Box ref={inputWrapperRef} sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <TextField
                        inputRef={inputRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={replyingTo ? `Responder a ${replyingTo.authorName}...` : 'Adicione um comentário... Use @ para mencionar'}
                        variant="outlined"
                        size="small"
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={5}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 6,
                                bgcolor: 'action.hover',
                                alignItems: 'flex-end',
                            },
                            '& .MuiInputBase-input': {
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                            },
                        }}
                    />
                    <Popper
                        open={showMentionDropdown}
                        anchorEl={inputRef.current}
                        placement="bottom-start"
                        modifiers={[
                            { name: 'offset', options: { offset: [0, 4] } },
                            { name: 'flip', enabled: true },
                        ]}
                        style={{ zIndex: 1400 }}
                    >
                        <Paper
                            elevation={3}
                            sx={{
                                minWidth: 260,
                                maxWidth: 400,
                                maxHeight: 220,
                                overflow: 'auto',
                                borderRadius: 2,
                            }}
                        >
                            {mentionUsersLoading ? (
                                <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
                                    <CircularProgress size={24} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Carregando...
                                    </Typography>
                                </Box>
                            ) : filteredMentionUsers.length === 0 ? (
                                <Box sx={{ px: 2, py: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {mentionUsers.length === 0
                                            ? 'Nenhum usuário com Instagram/TikTok/YouTube cadastrado no perfil.'
                                            : 'Nenhum resultado. Digite o nome ou @ do usuário.'}
                                    </Typography>
                                </Box>
                            ) : (
                                <List dense disablePadding>
                                    {filteredMentionUsers.slice(0, 10).map((u) => (
                                        <ListItemButton
                                            key={u.id}
                                            onClick={() => insertMention(u.handle)}
                                            sx={{ py: 0.75 }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 40 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        fontSize: '0.875rem',
                                                        bgcolor: 'primary.main',
                                                    }}
                                                >
                                                    {u.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={u.name}
                                                secondary={'@' + u.handle}
                                                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                            />
                                        </ListItemButton>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Popper>
                </Box>

                <Button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    sx={{
                        minWidth: 'auto',
                        fontWeight: 'bold',
                        textTransform: 'none',
                    }}
                >
                    {isSubmitting ? <CircularProgress size={20} /> : 'Enviar'}
                </Button>
                </Box>
            </Box>
            </Box>
        </Drawer>

        <Dialog
            open={!!deleteConfirm}
            onClose={() => !isDeleting && setDeleteConfirm(null)}
            aria-labelledby="delete-comment-dialog-title"
            aria-describedby="delete-comment-dialog-description"
        >
            <DialogTitle id="delete-comment-dialog-title">Dome</DialogTitle>
            <DialogContent>
                <DialogContentText id="delete-comment-dialog-description">
                    Tem certeza que deseja excluir este comentário?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                    Cancelar
                </Button>
                <Button onClick={handleDeleteCommentConfirm} color="error" disabled={isDeleting} autoFocus>
                    {isDeleting ? <CircularProgress size={24} /> : 'Excluir'}
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
}

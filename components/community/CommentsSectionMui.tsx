'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from '@mui/material';
import {
    Close as CloseIcon,
    ChatBubbleOutline as ChatIcon,
    Delete as DeleteIcon,
    Reply as ReplyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Send as SendIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';

interface CommentAuthor {
    id: string;
    name: string;
    avatar_url?: string;
}

interface Reply {
    _id: string;
    author: CommentAuthor;
    content: string;
    created_at: string;
    likes_count?: number;
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

export function CommentsSectionMui({ postId, isOpen, onClose, onCommentAdded }: CommentsSectionMuiProps) {
    const { account } = useAccount();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Buscar comentários da API
    const fetchComments = useCallback(async () => {
        if (!postId) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/posts/${postId}/comments`);

            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
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

    const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

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
            } else {
                const data = await response.json();
                alert(data.error || 'Erro ao deletar comentário');
            }
        } catch (error) {
            console.error('Erro ao deletar comentário:', error);
            alert('Erro ao deletar comentário');
        }
    };

    const isMyComment = (authorId: string) => {
        return account?.id === authorId;
    };

    const addEmoji = (emoji: string) => {
        setCommentText(prev => prev + emoji);
        inputRef.current?.focus();
    };

    const userName = account?.first_name || 'U';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
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
                                <Stack direction="row" spacing={1.5}>
                                    <Avatar
                                        src={comment.author.avatar_url}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        {comment.author.name.charAt(0).toUpperCase()}
                                    </Avatar>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                bgcolor: 'action.hover',
                                                borderRadius: 3,
                                                px: 2,
                                                py: 1.5,
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight={600}>
                                                {comment.author.name}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ wordBreak: 'break-word', mt: 0.25 }}
                                            >
                                                {comment.content}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={2} sx={{ mt: 0.75, pl: 1.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatTimeAgo(comment.created_at)}
                                            </Typography>
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
                                            {isMyComment(comment.author.id) && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteComment(comment._id)}
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
                                                        <Stack key={reply._id} direction="row" spacing={1}>
                                                            <Avatar
                                                                src={reply.author.avatar_url}
                                                                sx={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    background: 'linear-gradient(135deg, #4ade80 0%, #3b82f6 100%)',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                            >
                                                                {reply.author.name.charAt(0).toUpperCase()}
                                                            </Avatar>

                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Box
                                                                    sx={{
                                                                        bgcolor: 'action.selected',
                                                                        borderRadius: 2,
                                                                        px: 1.5,
                                                                        py: 1,
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" fontWeight={600}>
                                                                        {reply.author.name}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="caption"
                                                                        display="block"
                                                                        sx={{ wordBreak: 'break-word' }}
                                                                    >
                                                                        {reply.content}
                                                                    </Typography>
                                                                </Box>
                                                                <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, pl: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                                                                        {formatTimeAgo(reply.created_at)}
                                                                    </Typography>
                                                                    {isMyComment(reply.author.id) && (
                                                                        <Button
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => handleDeleteComment(reply._id, true, comment._id)}
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
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    borderTop: 2,
                    borderColor: 'divider',
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: 'background.paper',
                    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
                }}
            >
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

                <TextField
                    inputRef={inputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyingTo ? `Responder a ${replyingTo.authorName}...` : 'Adicione um comentário...'}
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 6,
                            bgcolor: 'action.hover',
                        },
                    }}
                />

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
        </Drawer>
    );
}

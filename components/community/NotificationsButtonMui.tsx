'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Box,
    CircularProgress,
    Divider,
} from '@mui/material';
import {
    NotificationsOutlined as NotificationsIcon,
    Favorite as LikeIcon,
    ChatBubble as CommentIcon,
    Reply as ReplyIcon,
    AlternateEmail as MentionIcon,
} from '@mui/icons-material';

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'mention';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    created_at: string;
    is_read: boolean;
    actor: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
    post_id?: string;
    comment_id?: string;
    content_preview?: string;
    likes_count?: number; // Quantidade de likes no comentário/post
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

function getNotificationLabel(notification: NotificationItem): string {
    const { type, comment_id, likes_count } = notification;

    switch (type) {
        case 'like':
            if (comment_id) {
                // Like em comentário
                if (likes_count && likes_count > 1) {
                    return `e mais ${likes_count - 1} curtiram seu comentário`;
                }
                return 'curtiu seu comentário';
            }
            return 'curtiu seu post';
        case 'comment':
            return 'comentou no seu post';
        case 'reply':
            return 'respondeu seu comentário';
        case 'follow':
            return 'começou a seguir você';
        case 'mention':
            return 'mencionou você';
        default:
            return 'interagiu';
    }
}

function getNotificationIcon(type: NotificationType) {
    switch (type) {
        case 'like':
            return <LikeIcon sx={{ fontSize: 14, color: 'error.main' }} />;
        case 'comment':
            return <CommentIcon sx={{ fontSize: 14, color: 'primary.main' }} />;
        case 'reply':
            return <ReplyIcon sx={{ fontSize: 14, color: 'success.main' }} />;
        case 'mention':
            return <MentionIcon sx={{ fontSize: 14, color: 'info.main' }} />;
        default:
            return null;
    }
}

export function NotificationsButtonMui() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const open = Boolean(anchorEl);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count ?? 0);
            }
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            setUnreadCount(0);
            // Atualizar estado local para mostrar como lidas
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Erro ao marcar notificações como lidas:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
        markAsRead();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                aria-label="Notificações"
            >
                <Badge
                    badgeContent={unreadCount > 99 ? '99+' : unreadCount}
                    color="error"
                    max={99}
                >
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 320,
                        maxWidth: '90vw',
                        maxHeight: '70vh',
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Notificações
                    </Typography>
                </Box>
                <Divider />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            Nenhuma notificação ainda
                        </Typography>
                    </Box>
                ) : (
                    notifications.map((n) => (
                        <MenuItem
                            key={n.id}
                            component={Link}
                            href={n.post_id ? `/dashboard/comunidade/${n.post_id}` : '#'}
                            onClick={handleClose}
                            sx={{
                                py: 1.5,
                                alignItems: 'flex-start',
                                bgcolor: n.is_read ? 'transparent' : 'action.hover',
                                '&:hover': {
                                    bgcolor: n.is_read ? 'action.hover' : 'action.selected',
                                }
                            }}
                        >
                            <ListItemAvatar>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={getNotificationIcon(n.type)}
                                >
                                    <Avatar
                                        src={n.actor.avatar_url || undefined}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                        }}
                                    >
                                        {n.actor.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" fontWeight={n.is_read ? 400 : 600} style={{ textWrap: "wrap" }}>
                                        <Typography component="span" fontWeight={600}>
                                            {n.actor.name}
                                        </Typography>{' '}
                                        {getNotificationLabel(n)}
                                    </Typography>
                                }
                                secondary={
                                    <Box component="span">
                                        {n.content_preview && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: 200,
                                                }}
                                            >
                                                &quot;{n.content_preview}&quot;
                                            </Typography>
                                        )}
                                        <Typography variant="caption" color="text.disabled">
                                            {formatTimeAgo(n.created_at)}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
}

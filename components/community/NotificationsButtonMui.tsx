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
import { Notifications as NotificationsIcon } from '@mui/icons-material';

export type NotificationType = 'like' | 'comment' | 'reply';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    created_at: string;
    actor: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
    post_id: string;
    post_preview?: string;
    comment_preview?: string;
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

function getNotificationLabel(type: NotificationType): string {
    switch (type) {
        case 'like':
            return 'curtiu seu post';
        case 'comment':
            return 'comentou no seu post';
        case 'reply':
            return 'respondeu seu comentário';
        default:
            return 'interagiu';
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
            await fetch('/api/notifications', { method: 'POST' });
            setUnreadCount(0);
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
                            href={`/dashboard/comunidade/${n.post_id}`}
                            onClick={handleClose}
                            sx={{ py: 1.5, alignItems: 'flex-start' }}
                        >
                            <ListItemAvatar>
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
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography variant="body2">
                                        <Typography component="span" fontWeight={600}>
                                            {n.actor.name}
                                        </Typography>{' '}
                                        {getNotificationLabel(n.type)}
                                    </Typography>
                                }
                                secondary={
                                    <Box component="span">
                                        {n.comment_preview && (
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
                                                &quot;{n.comment_preview}&quot;
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

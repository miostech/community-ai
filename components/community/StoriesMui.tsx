'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Avatar,
    Typography,
    Stack,
    Badge,
} from '@mui/material';
import { LocalFireDepartment as ThumbUpIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';

const STORIES_SEEN_KEY = 'stories_seen_';

interface StoryUser {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
    interactionCount: number;
    latestStoryAt?: number;
    instagramProfile?: string;
    tiktokProfile?: string;
    primarySocialLink?: 'instagram' | 'tiktok' | null;
}

interface StoriesProps {
    users: StoryUser[];
}

export function StoriesMui({ users }: StoriesProps) {
    const router = useRouter();
    const [pressedStory, setPressedStory] = useState<string | null>(null);

    const handleStoryClick = (user: StoryUser) => {
        router.push(`/dashboard/comunidade/perfil/${user.id}`);
    };

    /** Borda colorida só quando essa pessoa tem stories não vistos (mesma lógica do perfil). */
    const hasUnseenStories = (user: StoryUser) => {
        if (user.latestStoryAt == null) return false;
        try {
            const v = typeof window !== 'undefined' ? localStorage.getItem(STORIES_SEEN_KEY + user.id) : null;
            const lastSeenAt = v ? Number(v) : null;
            return lastSeenAt == null || user.latestStoryAt > lastSeenAt;
        } catch {
            return true;
        }
    };

    return (
        <Box
            sx={{
                width: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
            }}
        >
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    px: 2,
                    py: 1.5,
                    minWidth: 'min-content',
                }}
            >
                {users.map((user, index) => {
                        const isFirst = index === 0;
                        /** Primeiro: arco dourado só se tiver stories; senão só troféu. Demais: arco colorido só se tiver stories não vistos */
                        const firstHasStories = isFirst && user.latestStoryAt != null;
                        const showRing = firstHasStories || (!isFirst && hasUnseenStories(user));
                        return (
                        <Box
                            key={user.id}
                            component="button"
                            onClick={() => handleStoryClick(user)}
                            onMouseEnter={() => setPressedStory(user.id)}
                            onMouseLeave={() => setPressedStory(null)}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flexShrink: 0,
                                minWidth: '80px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                p: 0,
                                transition: 'transform 0.2s',
                                transform: pressedStory === user.id ? 'scale(0.95)' : 'scale(1)',
                                '&:active': {
                                    transform: 'scale(0.95)',
                                },
                            }}
                        >
                            {/* Borda colorida só quando tem stories não vistos; sem borda quando já viu todos */}
                            {showRing ? (
                            <Box
                                sx={{
                                    borderRadius: '50%',
                                    background: isFirst
                                        ? 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #d97706 100%)'
                                        : 'linear-gradient(135deg, #facc15 0%, #ec4899 50%, #9333ea 100%)',
                                    p: '2.5px',
                                    transition: 'transform 0.2s',
                                    ...(isFirst && { boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)' }),
                                }}
                            >
                                <Box
                                    sx={{
                                        borderRadius: '50%',
                                        bgcolor: 'background.paper',
                                        p: '2.5px',
                                    }}
                                >
                                    <Badge
                                        overlap="circular"
                                        badgeContent={
                                            isFirst ? (
                                                <TrophyIcon
                                                    sx={{
                                                        fontSize: 18,
                                                        color: '#fff',
                                                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
                                                    }}
                                                />
                                            ) : null
                                        }
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #d97706 100%)',
                                                color: 'inherit',
                                                p: 0.25,
                                                minWidth: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                border: 'none',
                                                boxShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
                                            },
                                        }}
                                    >
                                        <Avatar
                                            src={user.avatar || undefined}
                                            alt={user.name}
                                            sx={{
                                                width: { xs: 64, sm: 72 },
                                                height: { xs: 64, sm: 72 },
                                                background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                                fontSize: '1.125rem',
                                                fontWeight: 'bold',
                                                boxShadow: 1,
                                            }}
                                        >
                                            {user.initials}
                                        </Avatar>
                                    </Badge>
                                </Box>
                            </Box>
                            ) : (
                                isFirst ? (
                                    <Badge
                                        overlap="circular"
                                        badgeContent={
                                            <TrophyIcon
                                                sx={{
                                                    fontSize: 18,
                                                    color: '#fff',
                                                    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
                                                }}
                                            />
                                        }
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #d97706 100%)',
                                                color: 'inherit',
                                                p: 0.25,
                                                minWidth: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                border: 'none',
                                                boxShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
                                            },
                                        }}
                                    >
                                        <Avatar
                                            src={user.avatar || undefined}
                                            alt={user.name}
                                            sx={{
                                                width: { xs: 64, sm: 72 },
                                                height: { xs: 64, sm: 72 },
                                                background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                                fontSize: '1.125rem',
                                                fontWeight: 'bold',
                                                boxShadow: 1,
                                            }}
                                        >
                                            {user.initials}
                                        </Avatar>
                                    </Badge>
                                ) : (
                                    <Avatar
                                        src={user.avatar || undefined}
                                        alt={user.name}
                                        sx={{
                                            width: { xs: 64, sm: 72 },
                                            height: { xs: 64, sm: 72 },
                                            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                            fontSize: '1.125rem',
                                            fontWeight: 'bold',
                                            boxShadow: 1,
                                        }}
                                    >
                                        {user.initials}
                                    </Avatar>
                                )
                            )}

                            <Typography
                                variant="caption"
                                sx={{
                                    mt: 1,
                                    fontWeight: 500,
                                    color: 'text.primary',
                                    maxWidth: 64,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                }}
                            >
                                {user.name.split(' ')[0]}
                            </Typography>

                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                                <ThumbUpIcon sx={{ fontSize: 12, color: 'purple' }} />
                                <Typography
                                    variant="caption"
                                    sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}
                                >
                                    {user.interactionCount}
                                </Typography>
                            </Stack>
                        </Box>
                        );
                })}
            </Stack>
        </Box>
    );
}

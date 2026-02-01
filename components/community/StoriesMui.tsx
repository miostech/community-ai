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
import { LocalFireDepartment as ThumbUpIcon } from '@mui/icons-material';

interface StoryUser {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
    interactionCount: number;
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

    const getRankBadge = (index: number) => {
        if (index === 0) return '🔥';
        if (index === 1) return '⭐';
        if (index === 2) return '✨';
        return null;
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
                    const badge = getRankBadge(index);

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
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                badgeContent={
                                    badge && (
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                border: '2px solid',
                                                borderColor: 'background.paper',
                                                boxShadow: 2,
                                            }}
                                        >
                                            {badge}
                                        </Box>
                                    )
                                }
                            >
                                {/* Ring gradient */}
                                <Box
                                    sx={{
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #facc15 0%, #ec4899 50%, #9333ea 100%)',
                                        p: '2.5px',
                                        transition: 'transform 0.2s',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            borderRadius: '50%',
                                            bgcolor: 'background.paper',
                                            p: '2.5px',
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
                                    </Box>
                                </Box>
                            </Badge>

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

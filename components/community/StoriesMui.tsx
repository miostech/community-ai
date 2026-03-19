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
import { EmojiEvents as TrophyIcon, AutoAwesome as StoriesIcon, Add as AddIcon } from '@mui/icons-material';

const STORIES_SEEN_KEY = 'stories_seen_';
/** Tamanho total da área do avatar (com borda = avatar + padding dos 2 anéis). Todos os itens usam esse tamanho para alinhar. */
const AVATAR_AREA_SX = { width: { xs: 56, sm: 62 }, height: { xs: 56, sm: 62 } };
const AVATAR_SIZE = { xs: 48, sm: 54 };

interface StoryUser {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
    interactionCount: number;
    rankingWins: number;
    latestStoryAt?: number;
    instagramProfile?: string;
    tiktokProfile?: string;
    primarySocialLink?: 'instagram' | 'tiktok' | null;
}

interface StoriesProps {
    users: StoryUser[];
    /** Quando definido, ao clicar num usuário com stories, chama essa callback em vez de navegar ao perfil. */
    onStoryOpen?: (userId: string, userName: string) => void;
    /** Quando definido, mostra um botão "+" para gravar/publicar story direto dali; ao clicar chama esta callback. */
    onAddStoryClick?: () => void;
}

export function StoriesMui({ users, onStoryOpen, onAddStoryClick }: StoriesProps) {
    const router = useRouter();
    const [pressedStory, setPressedStory] = useState<string | null>(null);

    const handleStoryClick = (user: StoryUser) => {
        if (onStoryOpen && user.latestStoryAt != null) {
            onStoryOpen(user.id, user.name);
        } else {
            router.push(`/dashboard/comunidade/perfil/${user.id}`);
        }
    };

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

    const first = users[0];
    const rest = users.slice(1);
    const storyPosters = rest.filter((u) => u.latestStoryAt != null);
    const sortedStoryPosters = [...storyPosters].sort((a, b) => {
        const aUnseen = hasUnseenStories(a);
        const bUnseen = hasUnseenStories(b);
        if (aUnseen && !bUnseen) return -1;
        if (!aUnseen && bUnseen) return 1;
        return (b.latestStoryAt ?? 0) - (a.latestStoryAt ?? 0);
    });
    /** Perfis sem story ativo, na ordem do ranking (mesma ordem de `users`). */
    const rankingOnly = rest.filter((u) => u.latestStoryAt == null);

    const hasStories = sortedStoryPosters.length > 0;

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
                spacing={0}
                alignItems="flex-start"
                sx={{
                    px: 2,
                    py: 0.5,
                    minWidth: 'min-content',
                }}
            >
                {/* #1 Ranking */}
                {first && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: hasStories ? 1 : 0 }}>
                        <Typography
                            variant="caption"
                            component="a"
                            href="/dashboard/comunidade/ranking"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}
                            sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5, textDecoration: 'none', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
                        >
                            Ranking
                        </Typography>
                        {renderUser(first, true, handleStoryClick, pressedStory, setPressedStory, hasUnseenStories)}
                    </Box>
                )}

                {/* Divisor */}
                {first && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', mx: 1 }}>
                        <Box sx={{ width: '1px', flex: 1, bgcolor: 'divider', opacity: 0.5 }} />
                    </Box>
                )}

                {/* Stories */}
                {first && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5, pl: 0.5 }}>
                            <StoriesIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Comunidade
                            </Typography>
                        </Stack>
                        {(hasStories || onAddStoryClick || rankingOnly.length > 0) ? (
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                {onAddStoryClick && (
                                    <Box
                                        component="button"
                                        onClick={onAddStoryClick}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            flexShrink: 0,
                                            minWidth: '64px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            p: 0,
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.05)' },
                                            '&:active': { transform: 'scale(0.95)' },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                ...AVATAR_AREA_SX,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                borderRadius: '50%',
                                                border: '2px dashed',
                                                borderColor: 'divider',
                                                bgcolor: 'action.hover',
                                            }}
                                        >
                                            <AddIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                mt: 0.5,
                                                fontWeight: 500,
                                                fontSize: '0.675rem',
                                                color: 'text.primary',
                                                maxWidth: 58,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                textAlign: 'center',
                                            }}
                                        >
                                            Seu story
                                        </Typography>
                                    </Box>
                                )}
                                {sortedStoryPosters.map((user) => renderUser(user, false, handleStoryClick, pressedStory, setPressedStory, hasUnseenStories))}
                                {rankingOnly.map((user) => renderUser(user, false, handleStoryClick, pressedStory, setPressedStory, hasUnseenStories))}
                            </Stack>
                        ) : (
                            <Typography variant="caption" sx={{ pl: 0.5, fontSize: 11, color: 'text.secondary' }}>
                               Nenhum story no momento. Seja o primeiro a publicar e se destaque!
                            </Typography>
                        )}
                    </Box>
                )}
            </Stack>
        </Box>
    );
}

function renderUser(
    user: StoryUser,
    isFirst: boolean,
    handleStoryClick: (user: StoryUser) => void,
    pressedStory: string | null,
    setPressedStory: (id: string | null) => void,
    hasUnseenStories: (user: StoryUser) => boolean,
) {
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
                                minWidth: '64px',
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
                            <Box
                                sx={{
                                    ...AVATAR_AREA_SX,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
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
                                                                fontSize: 14,
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
                                                        minWidth: 18,
                                                        height: 18,
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
                                                        width: AVATAR_SIZE,
                                                        height: AVATAR_SIZE,
                                                        background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                                        fontSize: '0.85rem',
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
                                                        fontSize: 14,
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
                                                    minWidth: 18,
                                                    height: 18,
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
                                                    width: AVATAR_SIZE,
                                                    height: AVATAR_SIZE,
                                                    background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                                    fontSize: '0.85rem',
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
                                                width: AVATAR_SIZE,
                                                height: AVATAR_SIZE,
                                                background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                boxShadow: 1,
                                            }}
                                        >
                                            {user.initials}
                                        </Avatar>
                                    )
                                )}
                            </Box>

                            <Typography
                                variant="caption"
                                sx={{
                                    mt: 0.5,
                                    fontWeight: 500,
                                    fontSize: '0.675rem',
                                    color: 'text.primary',
                                    maxWidth: 58,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                }}
                            >
                                {user.name.split(' ')[0]}
                            </Typography>

                        </Box>
                        );
}

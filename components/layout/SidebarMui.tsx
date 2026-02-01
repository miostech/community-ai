'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAccount } from '@/contexts/AccountContext';
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Avatar,
    Typography,
    Menu,
    MenuItem,
    IconButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Chat as ChatIcon,
    TrendingUp as TrendingUpIcon,
    Group as GroupIcon,
    History as HistoryIcon,
    MenuBook as MenuBookIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    KeyboardArrowUp as ArrowUpIcon,
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '@/contexts/ThemeContext';

const DRAWER_WIDTH = 256;

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    exactMatch?: boolean;
}

const navItems: NavItem[] = [
    {
        label: 'Criar Post',
        href: '/dashboard/comunidade/criar',
        icon: <AddIcon />,
    },
    {
        label: 'Chat com IA',
        href: '/dashboard/chat',
        icon: <ChatIcon />,
    },
    {
        label: 'Top Trends',
        href: '/dashboard/trends',
        icon: <TrendingUpIcon />,
    },
    {
        label: 'Comunidade',
        href: '/dashboard/comunidade',
        exactMatch: true,
        icon: <GroupIcon />,
    },
    {
        label: 'Histórico de conversas',
        href: '/dashboard/chat/historico',
        icon: <HistoryIcon />,
    },
    {
        label: 'Cursos',
        href: '/dashboard/cursos',
        icon: <MenuBookIcon />,
    },
];

export function SidebarMui() {
    const pathname = usePathname();
    const router = useRouter();
    const { account, fullName } = useAccount();
    const { theme, setTheme, resolvedTheme } = useAppTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        signOut({ callbackUrl: '/login' });
    };

    const handleProfile = () => {
        handleUserMenuClose();
        router.push('/dashboard/perfil');
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const getInitials = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                display: { xs: 'none', md: 'block' },
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                },
            }}
        >
            {/* Header com Logo */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            IA
                        </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Conteúdo IA
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        2.0
                    </Typography>
                </Link>
                <IconButton onClick={toggleTheme} size="small">
                    {resolvedTheme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
            </Box>

            {/* Navigation */}
            <List sx={{ flex: 1, py: 1 }}>
                {navItems.map((item) => {
                    const isActive = item.exactMatch
                        ? pathname === item.href
                        : pathname === item.href || pathname?.startsWith(item.href + '/');

                    return (
                        <ListItem key={item.href} disablePadding sx={{ px: 1, py: 0.25 }}>
                            <ListItemButton
                                component={Link}
                                href={item.href}
                                selected={isActive}
                                sx={{
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                                        color: 'white',
                                        '& .MuiListItemIcon-root': {
                                            color: 'white',
                                        },
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                        },
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: isActive ? 'white' : 'text.secondary',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: 14,
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* User Menu */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1 }}>
                <ListItemButton
                    onClick={handleUserMenuOpen}
                    sx={{
                        borderRadius: 2,
                        py: 1,
                    }}
                >
                    <Avatar
                        src={account?.avatar_url || undefined}
                        sx={{
                            width: 32,
                            height: 32,
                            mr: 1.5,
                            background: !account?.avatar_url
                                ? 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)'
                                : undefined,
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        {!account?.avatar_url && getInitials(fullName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {fullName}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                            }}
                        >
                            {account?.email || ''}
                        </Typography>
                    </Box>
                    <ArrowUpIcon
                        sx={{
                            color: 'text.secondary',
                            transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                        }}
                    />
                </ListItemButton>

                <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                width: DRAWER_WIDTH - 16,
                                mb: 1,
                            },
                        },
                    }}
                >
                    <MenuItem onClick={handleProfile}>
                        <ListItemIcon>
                            <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Meu Perfil" />
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Sair" />
                    </MenuItem>
                </Menu>
            </Box>
        </Drawer>
    );
}

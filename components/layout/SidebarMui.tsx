'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAccount } from '@/contexts/AccountContext';
import { DomeLogo } from '@/components/ui/DomeLogo';
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
    Collapse,
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
    ExpandLess,
    ExpandMore,
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '@/contexts/ThemeContext';
import { isChatLaunched } from '@/lib/chat-launch';

const DRAWER_WIDTH = 256;

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    exactMatch?: boolean;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    {
        label: 'Comunidade',
        href: '/dashboard/comunidade',
        exactMatch: true,
        icon: <GroupIcon />,
        children: [
            {
                label: 'Feed',
                href: '/dashboard/comunidade',
                icon: <GroupIcon fontSize="small" />,
                exactMatch: true,
            },
            {
                label: 'Criar Post',
                href: '/dashboard/comunidade/criar',
                icon: <AddIcon />,
            },
        ],
    },
    {
        label: 'Chat com IA',
        href: '/dashboard/chat',
        icon: <ChatIcon />,
    },
    {
        label: 'Histórico de conversas',
        href: '/dashboard/chat/historico',
        icon: <HistoryIcon />,
    },
    {
        label: 'Top Trends',
        href: '/dashboard/trends',
        icon: <TrendingUpIcon />,
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
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

    const toggleSubmenu = (label: string) => {
        setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const openSubmenu = (label: string) => {
        setOpenSubmenus((prev) => ({ ...prev, [label]: true }));
    };

    // Auto-open submenu if a child route is active
    const isChildActive = (item: NavItem) => {
        return item.children?.some(
            (child) => pathname === child.href || pathname?.startsWith(child.href + '/')
        );
    };

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
                <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <DomeLogo style={{ fontSize: 16, fontWeight: 600 }} />
                </Link>
                <IconButton onClick={toggleTheme} size="small">
                    {resolvedTheme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
            </Box>

            {/* Navigation */}
            <List sx={{ flex: 1, py: 1 }}>
                {navItems
                    .filter((item) => {
                        if (item.href === '/dashboard/chat/historico') return isChatLaunched();
                        return true;
                    })
                    .map((item) => {
                        const isActive = item.exactMatch
                            ? pathname === item.href
                            : pathname === item.href || pathname?.startsWith(item.href + '/');

                        const hasChildren = item.children && item.children.length > 0;
                        const isItemSelected = !hasChildren && isActive;
                        const submenuOpen = openSubmenus[item.label] ?? isChildActive(item) ?? false;

                        return (
                            <React.Fragment key={item.href}>
                                <ListItem disablePadding sx={{ px: 1, py: 0.25 }}>
                                    <ListItemButton
                                        component={Link}
                                        href={item.href}
                                        selected={isItemSelected}
                                        onClick={() => {
                                            if (hasChildren && !submenuOpen) {
                                                openSubmenu(item.label);
                                            }
                                        }}
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
                                                color: isItemSelected ? 'white' : 'text.secondary',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontSize: 14,
                                                fontWeight: isItemSelected ? 600 : 500,
                                            }}
                                        />
                                        {hasChildren && (
                                            <IconButton
                                                size="small"
                                                edge="end"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    toggleSubmenu(item.label);
                                                }}
                                            >
                                                {submenuOpen ? (
                                                    <ExpandLess sx={{ color: 'text.secondary' }} />
                                                ) : (
                                                    <ExpandMore sx={{ color: 'text.secondary' }} />
                                                )}
                                            </IconButton>
                                        )}
                                    </ListItemButton>
                                </ListItem>

                                {/* Submenu */}
                                {hasChildren && (
                                    <Collapse in={submenuOpen} timeout="auto" unmountOnExit>
                                        <List disablePadding>
                                            {item.children!.map((child) => {
                                                const isChildItemActive = child.exactMatch
                                                    ? pathname === child.href
                                                    : pathname === child.href || pathname?.startsWith(child.href + '/');

                                                return (
                                                    <ListItem key={child.href} disablePadding sx={{ px: 1, py: 0.25 }}>
                                                        <ListItemButton
                                                            component={Link}
                                                            href={child.href}
                                                            selected={isChildItemActive}
                                                            sx={{
                                                                borderRadius: 2,
                                                                pl: 6,
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
                                                                    minWidth: 32,
                                                                    color: isChildItemActive ? 'white' : 'text.secondary',
                                                                }}
                                                            >
                                                                {child.icon}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={child.label}
                                                                primaryTypographyProps={{
                                                                    fontSize: 13,
                                                                    fontWeight: isChildItemActive ? 600 : 400,
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>
                                )}
                            </React.Fragment>
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

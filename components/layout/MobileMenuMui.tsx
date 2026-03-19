'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import {
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Box,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Home as HomeIcon,
    Group as FeedIcon,
    Add as AddIcon,
    Settings as SettingsIcon,
    Work as WorkIcon,
    AdminPanelSettings as AdminIcon,
    PersonSearch as InfluencersIcon,
    Slideshow as PresentationIcon,
    MailOutline as MailOutlineIcon,
} from '@mui/icons-material';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const bottomNavItems: NavItem[] = [
    {
        label: 'Comunidade',
        href: '/dashboard',
        icon: <HomeIcon />,
    },
    {
        label: 'Feed',
        href: '/dashboard/comunidade',
        icon: <FeedIcon />,
    },
    {
        label: 'Criar',
        href: '/dashboard/comunidade/criar',
        icon: <AddIcon />,
    },
    {
        label: 'Trabalhos',
        href: '/dashboard/trabalhos',
        icon: <WorkIcon />,
    },
    {
        label: 'Perfil',
        href: '/dashboard/perfil',
        icon: <SettingsIcon />,
    },
];

export function MobileMenuMui() {
    const pathname = usePathname();
    const { account } = useAccount();
    const canAccessAdmin = account?.role === 'moderator' || account?.role === 'admin' || account?.role === 'criador';
    const isModerator = account?.role === 'moderator';
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [profileMenuAnchor, setProfileMenuAnchor] = React.useState<null | HTMLElement>(null);
    const profileMenuOpen = Boolean(profileMenuAnchor);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        setProfileMenuAnchor(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileMenuAnchor(null);
    };

    // Observar se há modal aberto
    React.useEffect(() => {
        const checkModal = () => {
            setIsModalOpen(document.body.classList.contains('comments-modal-open'));
        };

        checkModal();

        const observer = new MutationObserver(checkModal);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    // Perfil na tab bar: para admin/moderador pode abrir menu (Meu perfil, Campanhas, Influenciadores, DM)
    const getCurrentValue = () => {
        if (
            canAccessAdmin &&
            (pathname?.startsWith('/dashboard/admin') ||
                pathname?.startsWith('/dashboard/influenciadores') ||
                pathname?.startsWith('/dashboard/mensagens'))
        ) {
            const profileIndex = bottomNavItems.findIndex((i) => i.label === 'Perfil');
            return profileIndex >= 0 ? profileIndex : 0;
        }
        const index = bottomNavItems.findIndex((item) => {
            const href = item.href;
            return pathname === href || pathname?.startsWith(href + '/');
        });
        return index >= 0 ? index : 0;
    };

    if (isModalOpen) {
        return null;
    }

    return (
        <Paper
            sx={{
                display: { xs: 'block', md: 'none' },
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                borderTop: '1px solid',
                borderColor: 'divider',
                pb: 'env(safe-area-inset-bottom)',
            }}
            elevation={3}
        >
            <BottomNavigation
                value={getCurrentValue()}
                showLabels={false}
                sx={{
                    bgcolor: 'background.paper',
                    '& .MuiBottomNavigationAction-root': {
                        minWidth: 'auto',
                        padding: '6px 0',
                        '&.Mui-selected': {
                            color: 'text.primary',
                        },
                    },
                }}
            >
                {bottomNavItems.map((item, index) => {
                    const isProfile = item.label === 'Perfil';
                    const itemHref = item.href; // sempre usa o href do item (Perfil = /dashboard/perfil = Meu perfil)
                    const isCreate = item.label === 'Criar';
                    const isActive = pathname === itemHref || pathname?.startsWith(itemHref + '/');

                    if (isCreate) {
                        return (
                            <BottomNavigationAction
                                key={item.href}
                                component={Link}
                                href={itemHref}
                                icon={
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: 2,
                                        }}
                                    >
                                        <AddIcon sx={{ color: 'white', fontSize: 20 }} />
                                    </Box>
                                }
                                sx={{
                                    '&.Mui-selected': {
                                        color: 'inherit',
                                    },
                                }}
                            />
                        );
                    }

                    if (isProfile && canAccessAdmin) {
                        // Admin/Moderador: ícone de engrenagem abre menu (Meu perfil, Campanhas, Influenciadores, DM)
                        const isAnyActive =
                            isActive ||
                            pathname?.startsWith('/dashboard/admin') ||
                            pathname?.startsWith('/dashboard/influenciadores') ||
                            pathname?.startsWith('/dashboard/mensagens');
                        return (
                            <BottomNavigationAction
                                key={item.href}
                                onClick={handleProfileMenuOpen}
                                icon={<SettingsIcon />}
                                sx={{
                                    opacity: isAnyActive ? 1 : 0.6,
                                }}
                            />
                        );
                    }

                    if (isProfile) {
                        return (
                            <BottomNavigationAction
                                key={item.href}
                                component={Link}
                                href={itemHref}
                                icon={<SettingsIcon />}
                                sx={{
                                    opacity: isActive ? 1 : 0.6,
                                }}
                            />
                        );
                    }

                    return (
                        <BottomNavigationAction
                            key={item.href}
                            component={Link}
                            href={itemHref}
                            icon={item.icon}
                            sx={{
                                opacity: isActive ? 1 : 0.6,
                            }}
                        />
                    );
                })}
            </BottomNavigation>
            {canAccessAdmin && (
                <Menu
                    anchorEl={profileMenuAnchor}
                    open={profileMenuOpen}
                    onClose={handleProfileMenuClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    slotProps={{
                        paper: {
                            sx: { minWidth: 200, mt: -2 },
                        },
                    }}
                >
                    <MenuItem
                        component={Link}
                        href="/dashboard/perfil"
                        onClick={handleProfileMenuClose}
                        selected={pathname === '/dashboard/perfil'}
                    >
                        <ListItemIcon>
                            <SettingsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Meu perfil</ListItemText>
                    </MenuItem>
                    <MenuItem
                        component={Link}
                        href="/dashboard/admin"
                        onClick={handleProfileMenuClose}
                        selected={pathname?.startsWith('/dashboard/admin')}
                    >
                        <ListItemIcon>
                            <AdminIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Campanhas</ListItemText>
                    </MenuItem>
                    <MenuItem
                        component={Link}
                        href="/dashboard/mensagens"
                        onClick={handleProfileMenuClose}
                        selected={pathname?.startsWith('/dashboard/mensagens')}
                    >
                        <ListItemIcon>
                            <MailOutlineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>DM privada</ListItemText>
                    </MenuItem>
                    {isModerator
                        ? [
                              <MenuItem
                                  key="influenciadores"
                                  component={Link}
                                  href="/dashboard/influenciadores"
                                  onClick={handleProfileMenuClose}
                                  selected={
                                      pathname === '/dashboard/influenciadores' ||
                                      pathname?.startsWith('/dashboard/influenciadores/')
                                  }
                              >
                                  <ListItemIcon>
                                      <InfluencersIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText>Influenciadores</ListItemText>
                              </MenuItem>,
                              <MenuItem
                                  key="apresentacao"
                                  component={Link}
                                  href="/dashboard/influenciadores/apresentacao"
                                  onClick={handleProfileMenuClose}
                                  selected={pathname?.startsWith('/dashboard/influenciadores/apresentacao')}
                              >
                                  <ListItemIcon>
                                      <PresentationIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText>Dome Creators</ListItemText>
                              </MenuItem>,
                          ]
                        : null}
                </Menu>
            )}
        </Paper>
    );
}

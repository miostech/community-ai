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
} from '@mui/material';
import {
    Home as HomeIcon,
    Group as FeedIcon,
    Add as AddIcon,
    Settings as SettingsIcon,
    Work as WorkIcon,
    AdminPanelSettings as AdminIcon,
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
    const [isModalOpen, setIsModalOpen] = React.useState(false);

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

    // Perfil na tab bar sempre vai para "Meu perfil" (/dashboard/perfil), não para o perfil público
    // Encontrar o índice do item ativo
    const getCurrentValue = () => {
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
                {canAccessAdmin && (
                    <BottomNavigationAction
                        component={Link}
                        href="/dashboard/admin"
                        icon={<AdminIcon />}
                        sx={{
                            opacity: pathname?.startsWith('/dashboard/admin') ? 1 : 0.6,
                            color: pathname?.startsWith('/dashboard/admin') ? 'primary.main' : undefined,
                        }}
                    />
                )}
            </BottomNavigation>
        </Paper>
    );
}

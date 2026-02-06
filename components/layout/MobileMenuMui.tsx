'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useAccount } from '@/contexts/AccountContext';
import {
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Avatar,
    Box,
} from '@mui/material';
import {
    Home as HomeIcon,
    TrendingUp as TrendingUpIcon,
    Add as AddIcon,
    MenuBook as MenuBookIcon,
    Person as PersonIcon,
} from '@mui/icons-material';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const bottomNavItems: NavItem[] = [
    {
        label: 'Comunidade',
        href: '/dashboard/comunidade',
        icon: <HomeIcon />,
    },
    {
        label: 'Trends',
        href: '/dashboard/trends',
        icon: <TrendingUpIcon />,
    },
    {
        label: 'Criar',
        href: '/dashboard/comunidade/criar',
        icon: <AddIcon />,
    },
    {
        label: 'Cursos',
        href: '/dashboard/cursos',
        icon: <MenuBookIcon />,
    },
    {
        label: 'Perfil',
        href: '/dashboard/perfil',
        icon: <PersonIcon />,
    },
];

export function MobileMenuMui() {
    const pathname = usePathname();
    const { user } = useUser();
    const { account, fullName } = useAccount();
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

    // Encontrar o índice do item ativo
    const getCurrentValue = () => {
        const index = bottomNavItems.findIndex(
            (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
        );
        return index >= 0 ? index : 0;
    };

    const getInitials = (name: string) => {
        return name.charAt(0).toUpperCase();
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
                    const isProfile = item.href === '/dashboard/perfil';
                    const isCreate = item.label === 'Criar';
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                    if (isCreate) {
                        return (
                            <BottomNavigationAction
                                key={item.href}
                                component={Link}
                                href={item.href}
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
                                href={item.href}
                                icon={
                                    <Avatar
                                        src={account?.avatar_url || user?.avatar || undefined}
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            border: isActive ? '2px solid' : '2px solid transparent',
                                            borderColor: isActive ? 'text.primary' : 'transparent',
                                            background: !(account?.avatar_url || user?.avatar)
                                                ? 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)'
                                                : undefined,
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {!(account?.avatar_url || user?.avatar) && getInitials(fullName || user?.name || 'U')}
                                    </Avatar>
                                }
                            />
                        );
                    }

                    return (
                        <BottomNavigationAction
                            key={item.href}
                            component={Link}
                            href={item.href}
                            icon={item.icon}
                            sx={{
                                opacity: isActive ? 1 : 0.6,
                            }}
                        />
                    );
                })}
            </BottomNavigation>
        </Paper>
    );
}

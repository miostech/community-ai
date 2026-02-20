'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import { useUser } from '@/contexts/UserContext';
import { Box, IconButton, Avatar } from '@mui/material';
import { DomeLogo } from '@/components/ui/DomeLogo';

export const MOBILE_HEADER_HEIGHT_PX = 56;
/** Para usar como padding-top do conteúdo: altura do header + safe area no notch */
export const MOBILE_HEADER_OFFSET = 'calc(56px + env(safe-area-inset-top, 0px))';

export function MobileHeaderMui() {
  const pathname = usePathname();
  const { account, fullName } = useAccount();
  const { user } = useUser();
  const profileHref = account?.id ? `/dashboard/comunidade/perfil/${account.id}` : '/dashboard/perfil';
  const isActive = pathname === profileHref;

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <Box
      component="header"
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: MOBILE_HEADER_HEIGHT_PX,
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        zIndex: 1100,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pt: 'env(safe-area-inset-top)',
      }}
    >
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <DomeLogo style={{ fontSize: 18, fontWeight: 600 }} />
      </Link>

      <IconButton
        component={Link}
        href={profileHref}
        aria-label="Meu perfil"
        sx={{
          p: 0.5,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          src={account?.avatar_url || user?.avatar || undefined}
          sx={{
            width: 36,
            height: 36,
            border: isActive ? '2px solid' : '2px solid transparent',
            borderColor: isActive ? 'primary.main' : 'transparent',
            background: !(account?.avatar_url || user?.avatar)
              ? 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)'
              : undefined,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {!(account?.avatar_url || user?.avatar) && getInitials(fullName || user?.name || 'U')}
        </Avatar>
      </IconButton>
    </Box>
  );
}


'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, Tab, Box } from '@mui/material';
import {
  Storefront as StorefrontIcon,
  Assignment as AssignmentIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

const tabs = [
  { label: 'Vitrine', href: '/dashboard/trabalhos/vitrine', icon: <StorefrontIcon /> },
  { label: 'Minhas Campanhas', href: '/dashboard/trabalhos/minhas-campanhas', icon: <AssignmentIcon /> },
  { label: 'Portfólio', href: '/dashboard/trabalhos/portfolio', icon: <BadgeIcon /> },
];

export function TrabalhosTabs() {
  const pathname = usePathname();
  const currentTab = tabs.findIndex((tab) => pathname?.startsWith(tab.href));

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        mb: { xs: 2, sm: 3 },
        mx: { xs: -2, sm: 0 },
      }}
    >
      <Tabs
        value={currentTab >= 0 ? currentTab : 0}
        variant="scrollable"
        scrollButtons={false}
        allowScrollButtonsMobile
        sx={{
          minHeight: 44,
          '& .MuiTab-root': {
            minHeight: 44,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.8rem', sm: '0.85rem' },
            px: { xs: 1.5, sm: 2.5 },
            gap: 0.5,
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.href}
            component={Link}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
}

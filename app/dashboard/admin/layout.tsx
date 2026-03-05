'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import { Box, CircularProgress } from '@mui/material';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { account, isLoading } = useAccount();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && account && !['moderator', 'admin', 'criador'].includes(account.role || '')) {
            router.replace('/dashboard');
        }
    }, [account, isLoading, router]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!account || !['moderator', 'admin', 'criador'].includes(account.role || '')) {
        return null;
    }

    return <>{children}</>;
}

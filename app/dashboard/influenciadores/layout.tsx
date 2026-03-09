'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import { Box, CircularProgress } from '@mui/material';

export default function InfluenciadoresLayout({ children }: { children: React.ReactNode }) {
    const { account, isLoading } = useAccount();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && account && account.role !== 'moderator') {
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

    if (!account || account.role !== 'moderator') {
        return null;
    }

    return <>{children}</>;
}

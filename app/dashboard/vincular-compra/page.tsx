'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function VincularCompraDashboardRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/vincular-compra');
    }, [router]);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress />
        </Box>
    );
}

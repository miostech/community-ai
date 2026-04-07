'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Typography, Breadcrumbs, Paper, Chip } from '@mui/material';

export default function MarcaTrackingPage() {
    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            <Breadcrumbs sx={{ mb: 2, '& a': { color: 'text.secondary', textDecoration: 'none' } }}>
                <Link href="/marca/inicio">Dashboard</Link>
                <Typography color="text.primary" fontWeight={600}>
                    Tracking
                </Typography>
            </Breadcrumbs>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Tracking <Chip label="Beta" size="small" color="primary" sx={{ fontWeight: 700 }} />
                </Typography>
                <Typography color="text.secondary">Métricas e atribuição de campanhas em breve.</Typography>
            </Paper>
        </Box>
    );
}

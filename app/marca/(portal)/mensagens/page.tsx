'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Typography, Breadcrumbs, Paper } from '@mui/material';

export default function MarcaMensagensPage() {
    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            <Breadcrumbs sx={{ mb: 2, '& a': { color: 'text.secondary', textDecoration: 'none' } }}>
                <Link href="/marca/inicio">Dashboard</Link>
                <Typography color="text.primary" fontWeight={600}>
                    Mensagens
                </Typography>
            </Breadcrumbs>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                    Mensagens
                </Typography>
                <Typography color="text.secondary">Central de mensagens com creators em desenvolvimento.</Typography>
            </Paper>
        </Box>
    );
}

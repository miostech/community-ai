'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Typography, Breadcrumbs, Paper } from '@mui/material';

export default function MarcaComunidadesPage() {
    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            <Breadcrumbs sx={{ mb: 2, '& a': { color: 'text.secondary', textDecoration: 'none' } }}>
                <Link href="/marca/inicio">Dashboard</Link>
                <Typography color="text.primary" fontWeight={600}>
                    Comunidades
                </Typography>
            </Breadcrumbs>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                    Comunidades
                </Typography>
                <Typography color="text.secondary">Em breve você poderá criar e gerenciar comunidades de creators aqui.</Typography>
            </Paper>
        </Box>
    );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Typography, Breadcrumbs, Paper } from '@mui/material';

export default function MarcaAulasPage() {
    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            <Breadcrumbs sx={{ mb: 2, '& a': { color: 'text.secondary', textDecoration: 'none' } }}>
                <Link href="/marca/inicio">Dashboard</Link>
                <Typography color="text.primary" fontWeight={600}>
                    Aulas & Tutoriais
                </Typography>
            </Breadcrumbs>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                    Aulas & Tutoriais
                </Typography>
                <Typography color="text.secondary">Conteúdos educativos para marcas em breve.</Typography>
            </Paper>
        </Box>
    );
}

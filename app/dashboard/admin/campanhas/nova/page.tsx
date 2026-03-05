'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Typography, Stack, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CampaignForm } from '@/components/admin/CampaignForm';

export default function NovaCampanhaPage() {
    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Button
                    component={Link}
                    href="/dashboard/admin/campanhas"
                    startIcon={<ArrowBackIcon />}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Campanhas
                </Button>
            </Stack>

            <Stack spacing={0.5} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                    Nova campanha
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Preencha os dados para criar uma nova campanha de marca.
                </Typography>
            </Stack>

            <CampaignForm mode="create" />
        </Box>
    );
}

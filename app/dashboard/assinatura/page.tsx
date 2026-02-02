'use client';

import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { PricingPlans } from '@/components/pricing/PricingPlans';

export default function AssinaturaPage() {
    return (
        <Container maxWidth="lg" sx={{ pb: 10 }}>
            <PricingPlans
                title="Ative sua assinatura"
                subtitle="Escolha o plano ideal para você"
                showFAQ={false}
            />
        </Container>
    );
}

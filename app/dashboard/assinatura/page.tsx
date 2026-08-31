'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Container, CircularProgress, Box, Typography, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { useAccount } from '@/contexts/AccountContext';

export default function AssinaturaPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoading, isSubscriptionEffective, subscription } = useAccount();

    const fromCadastro = searchParams.get('origem') === 'cadastro';
    const hasActiveSubscription = subscription?.status === 'active';

    useEffect(() => {
        if (isLoading) return;
        if (fromCadastro && !hasActiveSubscription) return;
        if (isSubscriptionEffective) {
            router.push('/dashboard/comunidade');
        }
    }, [isLoading, isSubscriptionEffective, hasActiveSubscription, fromCadastro, router]);

    if (isLoading || (isSubscriptionEffective && !fromCadastro) || (isSubscriptionEffective && hasActiveSubscription)) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }


    return (
        <Container maxWidth="lg" sx={{ pb: 10 }}>
            <PricingPlans
                title="Ative sua assinatura"
                subtitle="Escolha o plano ideal para você"
                showFAQ={false}
            />
            <Box sx={{ textAlign: 'center', mt: 4, py: 3, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Comprou na Kiwify com um email diferente?
                </Typography>
                <Button
                    component={Link}
                    href="/dashboard/vincular-compra"
                    variant="text"
                    size="small"
                >
                    Vincular compra ao meu cadastro
                </Button>
            </Box>
        </Container>
    );
}

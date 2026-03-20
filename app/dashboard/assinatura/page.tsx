'use client';

import React, { useEffect } from 'react';
import { Container, CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { useAccount } from '@/contexts/AccountContext';

export default function AssinaturaPage() {
    const router = useRouter();
    const { isLoading, isSubscriptionEffective } = useAccount();

    // Se já tem assinatura ativa ou período de graça (cadastro recente), redireciona para o dashboard
    useEffect(() => {
        if (!isLoading && isSubscriptionEffective) {
            console.log('✅ Assinatura ativa ou graça - redirecionando para dashboard');
            router.push('/dashboard/comunidade');
        }
    }, [isLoading, isSubscriptionEffective, router]);

    // Mostra loading enquanto carrega ou se vai redirecionar
    if (isLoading || isSubscriptionEffective) {
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
        </Container>
    );
}

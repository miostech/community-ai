'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { MarcaCampanhaWizard } from '@/components/marca/MarcaCampanhaWizard';
import { useAccount } from '@/contexts/AccountContext';
import { isBrandProfileComplete } from '@/lib/marca-brand-profile';

function NovaCampanhaWizardShell() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const continueId = searchParams.get('continue')?.trim() || undefined;

    return (
        <MarcaCampanhaWizard
            open
            continueCampaignId={continueId}
            onClose={() => router.push('/marca/campanhas')}
        />
    );
}

export default function NovaMarcaCampanhaPage() {
    const router = useRouter();
    const { account, isLoading } = useAccount();

    useEffect(() => {
        if (isLoading || !account) return;
        if (!isBrandProfileComplete(account)) {
            router.replace('/marca/inicio');
        }
    }, [account, isLoading, router]);

    if (isLoading || !account) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isBrandProfileComplete(account)) {
        return null;
    }

    return (
        <Suspense
            fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            }
        >
            <NovaCampanhaWizardShell />
        </Suspense>
    );
}

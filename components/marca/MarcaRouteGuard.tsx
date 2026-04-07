'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAccount } from '@/contexts/AccountContext';

const ALLOWED = new Set(['marca', 'moderator', 'admin']);

export function MarcaRouteGuard({ children }: { children: React.ReactNode }) {
    const { account, isLoading, refreshAccount } = useAccount();
    const router = useRouter();
    const claimRan = useRef(false);
    const [claimFinished, setClaimFinished] = useState(false);

    useEffect(() => {
        if (isLoading || !account) return;

        const role = account.role || 'user';
        if (ALLOWED.has(role)) {
            setClaimFinished(true);
            return;
        }

        if (claimRan.current) {
            setClaimFinished(true);
            return;
        }
        claimRan.current = true;

        (async () => {
            try {
                const res = await fetch('/api/marca/claim-oauth', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.claimed) {
                        await refreshAccount();
                    }
                }
            } catch {
                /* ignore */
            } finally {
                setClaimFinished(true);
            }
        })();
    }, [isLoading, account, refreshAccount]);

    useEffect(() => {
        if (!claimFinished || isLoading || !account) return;
        if (!ALLOWED.has(account.role || 'user')) {
            router.replace('/marca/login');
        }
    }, [claimFinished, isLoading, account, router]);

    if (isLoading || !account || !claimFinished) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!ALLOWED.has(account.role || 'user')) {
        return null;
    }

    return <>{children}</>;
}

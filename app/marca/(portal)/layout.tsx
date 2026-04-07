'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AccountProvider } from '@/contexts/AccountContext';
import { MarcaRouteGuard } from '@/components/marca/MarcaRouteGuard';
import { MarcaPortalLayout } from '@/components/marca/MarcaPortalLayout';

export default function MarcaPortalGroupLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <AccountProvider>
                <MarcaRouteGuard>
                    <MarcaPortalLayout>{children}</MarcaPortalLayout>
                </MarcaRouteGuard>
            </AccountProvider>
        </ProtectedRoute>
    );
}

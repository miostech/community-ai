'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const hasUpdatedAccess = useRef(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Atualiza last_access_at uma vez quando autenticado
    useEffect(() => {
        if (status === 'authenticated' && !hasUpdatedAccess.current) {
            hasUpdatedAccess.current = true;
            fetch('/api/accounts/last-access', { method: 'POST' }).catch(() => { });
        }
    }, [status]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 dark:text-slate-400">Carregando...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return <>{children}</>;
}

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const hasUpdatedAccess = useRef(false);
    const [mounted, setMounted] = useState(false);

    // Evitar hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

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

    // Renderiza null no servidor e durante a montagem para evitar hydration mismatch
    if (!mounted || status === 'loading') {
        return null;
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return <>{children}</>;
}

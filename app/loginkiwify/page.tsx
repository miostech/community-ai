'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginKiwifyPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/vincular-compra');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

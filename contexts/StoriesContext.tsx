'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface StoryUser {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
    interactionCount: number;
    rankingWins: number;
    /** Timestamp (ms) do story mais recente — usado no feed para borda "não visto". */
    latestStoryAt?: number;
    stats?: {
        likesGiven: number;
        likesReceived: number;
        postsCount: number;
        commentsCount: number;
    };
    instagramProfile?: string;
    tiktokProfile?: string;
    youtubeProfile?: string;
    primarySocialLink?: 'instagram' | 'tiktok' | null;
}

export interface WeekInfo {
    start: string;
    end: string;
    label: string;
}

interface StoriesContextType {
    users: StoryUser[];
    week: WeekInfo | null;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    fetchUsers: () => Promise<void>;
    refreshUsers: () => Promise<void>;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export function StoriesProvider({ children }: { children: React.ReactNode }) {
    const [users, setUsers] = useState<StoryUser[]>([]);
    const [week, setWeek] = useState<WeekInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/accounts/stories');

            if (!response.ok) {
                throw new Error('Erro ao carregar usuários');
            }

            const data = await response.json();
            setUsers(data.users);
            setWeek(data.week);
            setIsInitialized(true);
        } catch (err) {
            console.error('Erro ao buscar usuários para stories:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshUsers = useCallback(async () => {
        await fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (!isInitialized) {
            fetchUsers();
        }
    }, [isInitialized, fetchUsers]);

    const value: StoriesContextType = {
        users,
        week,
        isLoading,
        error,
        isInitialized,
        fetchUsers,
        refreshUsers,
    };

    return (
        <StoriesContext.Provider value={value}>
            {children}
        </StoriesContext.Provider>
    );
}

export function useStories() {
    const context = useContext(StoriesContext);
    if (context === undefined) {
        throw new Error('useStories must be used within a StoriesProvider');
    }
    return context;
}

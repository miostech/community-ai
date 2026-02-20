'use client';

/**
 * CoursesContext — busca os cursos do usuário logado UMA VEZ e propaga para toda a app.
 *
 * Cache de 1 hora no localStorage por email.
 * Todas as páginas (cursos, perfil, comunidade/perfil) lêem daqui — zero chamadas extras à Kiwify.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { CURSOS, courseIdsIncludeCourse } from '@/lib/courses';

const CACHE_KEY_PREFIX = 'kiwify_courses_';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

interface CacheEntry {
  courseIds: string[];
  fetchedAt: number;
}

function getCacheKey(email: string): string {
  return `${CACHE_KEY_PREFIX}${email.trim().toLowerCase()}`;
}

function readCache(email: string): string[] | null {
  try {
    const raw = localStorage.getItem(getCacheKey(email));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(email));
      return null;
    }
    return entry.courseIds;
  } catch {
    return null;
  }
}

function writeCache(email: string, courseIds: string[]): void {
  try {
    const entry: CacheEntry = { courseIds, fetchedAt: Date.now() };
    localStorage.setItem(getCacheKey(email), JSON.stringify(entry));
  } catch { /* quota exceeded ou SSR */ }
}

interface CoursesContextValue {
  /** Slugs canônicos dos cursos que o usuário comprou (ex: ['AQDrLac', 'YIUXqzV']) */
  courseIds: string[];
  loading: boolean;
  /** Verifica se o usuário tem acesso a um curso (mesma lógica do courseIdsIncludeCourse) */
  hasCourse: (curso: { kiwifyProductIds?: string[]; kiwifyUrl?: string }) => boolean;
  /** Força revalidação imediata (ignora cache) */
  refresh: () => void;
}

const CoursesContext = createContext<CoursesContextValue>({
  courseIds: [],
  loading: false,
  hasCourse: () => false,
  refresh: () => {},
});

export function CoursesProvider({ children }: { children: React.ReactNode }) {
  const { account, isLoading: accountLoading } = useAccount();
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  const fetchCourses = useCallback(async (email: string, ignoreCache = false) => {
    if (!ignoreCache) {
      const cached = readCache(email);
      if (cached !== null) {
        setCourseIds(cached);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/kiwify/check-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = res.ok ? await res.json() : { courseIds: [] };
      const rawIds: string[] = data.courseIds ?? [];

      // Converte para slugs canônicos — mesma lógica de /cursos
      const slugIds = CURSOS
        .filter((curso) => courseIdsIncludeCourse(rawIds, curso))
        .map((curso) => curso.id);

      writeCache(email, slugIds);
      setCourseIds(slugIds);
    } catch {
      setCourseIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const email = account?.email?.trim();
    if (accountLoading || !email) {
      setCourseIds([]);
      return;
    }
    fetchCourses(email, forceRefresh > 0);
  }, [account?.email, accountLoading, fetchCourses, forceRefresh]);

  const hasCourse = useCallback(
    (curso: { kiwifyProductIds?: string[]; kiwifyUrl?: string }) =>
      courseIdsIncludeCourse(courseIds, curso),
    [courseIds]
  );

  const refresh = useCallback(() => {
    const email = account?.email?.trim();
    if (email) {
      localStorage.removeItem(getCacheKey(email));
      setForceRefresh((n) => n + 1);
    }
  }, [account?.email]);

  return (
    <CoursesContext.Provider value={{ courseIds, loading, hasCourse, refresh }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses(): CoursesContextValue {
  return useContext(CoursesContext);
}

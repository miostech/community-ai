'use client';

import React, { useEffect, useState } from 'react';

interface TrendItem {
  id: string;
  query: string;
  position: number;
  value: string;
  extractedValue: number;
  link: string;
  type: 'top' | 'rising';
  topicType?: string;
  searchVolume?: number;
}

interface TrendsResponse {
  region: string;
  regionLabel: string;
  timeRange: string;
  trends: TrendItem[];
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'top' | 'rising'>('rising');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/trends');
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setError(json.error || 'Erro ao carregar trends');
          setData(null);
          return;
        }

        setData(json);
      } catch (e) {
        if (!cancelled) {
          setError('Falha ao conectar. Tente novamente.');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const trends = data?.trends ?? [];
  const filtered = trends.filter((t) => t.type === filter);

  const capitalize = (s: string) =>
    s.length
      ? s
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
      : s;

  const categoryPt: Record<string, string> = {
    all: 'Geral',
    other: 'Outros',
    entertainment: 'Entretenimento',
    sports: 'Esportes',
    technology: 'Tecnologia',
    business_and_finance: 'Negócios e finanças',
    politics: 'Política',
    health: 'Saúde',
    science: 'Ciência',
    games: 'Games',
    shopping: 'Compras',
    travel_and_transportation: 'Viagens e transporte',
    beauty_and_fashion: 'Beleza e moda',
    food_and_drink: 'Comida e bebida',
    autos_and_vehicles: 'Carros e veículos',
    hobbies_and_leisure: 'Hobbies e lazer',
    jobs_and_education: 'Empregos e educação',
    law_and_government: 'Lei e governo',
    pets_and_animals: 'Animais',
    climate: 'Clima',
  };

  const translateCategory = (cat: string) =>
    categoryPt[cat] ?? capitalize(cat.replace(/_/g, ' '));

  const formatVolume = (num: number | undefined): string => {
    if (num == null || Number.isNaN(num)) return '—';
    if (num >= 1_000_000) {
      const mi = num / 1_000_000;
      return `${mi % 1 === 0 ? mi : mi.toFixed(1).replace('.', ',')} mi`;
    }
    if (num >= 1_000) {
      const mil = num / 1_000;
      return `${mil % 1 === 0 ? mil : mil.toFixed(1).replace('.', ',')} mil`;
    }
    return num.toString();
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-24 sm:pb-8 bg-white dark:bg-black min-h-screen">
      <div className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-100 dark:border-neutral-800 backdrop-blur-lg bg-white/95 dark:bg-black/95">
        <div className="px-4 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
            Top Trends
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Pesquisas em alta no Google no Brasil. Use para se inspirar e criar conteúdo em alta.
          </p>
          {data?.regionLabel && (
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
              Região: {data.regionLabel} ·{' '}
              Últimas 24 horas
            </p>
          )}
        </div>

        {!loading && !error && trends.length > 0 && (
          <div className="px-4 pb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('rising')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'rising'
                  ? 'bg-gray-900 text-white dark:bg-slate-100 dark:text-black'
                  : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              Em alta
            </button>
            <button
              type="button"
              onClick={() => setFilter('top')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'top'
                  ? 'bg-gray-900 text-white dark:bg-slate-100 dark:text-black'
                  : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              Populares
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-slate-400">
            <svg
              className="animate-spin h-8 w-8 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p>Carregando trends do Brasil...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200">
            <p className="font-medium">Não foi possível carregar os trends</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-amber-700 dark:text-amber-300">
              Configure <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">SEARCHAPI_API_KEY</code> em <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env.local</code> usando uma chave do{' '}
              <a
                href="https://www.searchapi.io/docs/google-trends"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                SearchAPI (Google Trends)
              </a>
              .
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-slate-400">
            Nenhum trend encontrado para o filtro selecionado.
          </div>
        )}

        {!loading && !error && filtered.length > 0 &&
          filtered.map((trend, index) => (
            <div key={trend.id} className="mb-4">
              <div className="flex items-center gap-3 py-3">
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-400 dark:text-slate-500">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <a
                    href={trend.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100 mb-0.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {capitalize(trend.query)}
                    </h3>
                  </a>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        trend.type === 'rising'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      {trend.type === 'rising' ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          {trend.value === 'Breakout' ? 'Alta' : `${trend.value}`}
                          {trend.searchVolume != null && trend.searchVolume > 0 && (
                            <span className="opacity-90">
                              {' · '}
                              {"+" + formatVolume(trend.searchVolume)}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          {formatVolume(
                            trend.searchVolume ??
                              (trend.type === 'top' ? trend.extractedValue : undefined)
                          )}
                        </>
                      )}
                    </span>
                    {trend.topicType && (
                      <span className="text-gray-500 dark:text-slate-500">
                        {translateCategory(trend.topicType)}
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={trend.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  title="Pesquisar no Google"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>

              {index < filtered.length - 1 && (
                <div className="border-t border-gray-100 dark:border-slate-800 mt-1" />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

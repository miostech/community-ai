import { NextResponse } from 'next/server';

const SEARCHAPI_API_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Item retornado pelo Google Trends Trending Now (API pode vir em snake_case ou camelCase) */
interface TrendingNowItem {
  position: number;
  query: string;
  search_volume?: number;
  searchVolume?: number;
  percentage_increase?: number;
  percentageIncrease?: number;
  location?: string;
  categories?: string[];
  is_active?: boolean;
  keywords?: string[];
}

/** Resposta da SearchAPI para google_trends_trending_now */
interface TrendingNowResponse {
  trends?: TrendingNowItem[];
  search_parameters?: { geo?: string; time?: string };
}

/** Formato unificado para a página de trends */
export interface TrendItem {
  id: string;
  query: string;
  position: number;
  value: string;
  extractedValue: number;
  link: string;
  type: 'top' | 'rising';
  topicType?: string;
  /** Volume de pesquisa (Trending Now) */
  searchVolume?: number;
}

async function fetchTrendingNow(
  geo = 'BR',
  timeRange = 'past_24_hours'
): Promise<TrendingNowResponse> {
  const params = new URLSearchParams({
    engine: 'google_trends_trending_now',
    geo,
    time: timeRange,
    api_key: SEARCHAPI_API_KEY!,
  });

  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SearchAPI error: ${res.status} ${text}`);
  }

  return res.json() as Promise<TrendingNowResponse>;
}

function normalizeTrends(data: TrendingNowResponse | null): TrendItem[] {
  const items: TrendItem[] = [];
  const trends = data?.trends ?? [];

  trends.forEach((t, index) => {
    const pct = t.percentage_increase ?? t.percentageIncrease ?? 0;
    const volume = t.search_volume ?? t.searchVolume;
    const type: 'top' | 'rising' = pct >= 200 ? 'rising' : 'top';
    const valueStr =
      pct >= 1000 ? 'Breakout' : pct > 0 ? `+${pct}%` : String(volume ?? t.position);

    items.push({
      id: `trend-${index + 1}-${t.query.toLowerCase().replace(/\s+/g, '-')}`,
      query: t.query,
      position: t.position,
      value: valueStr,
      extractedValue: pct || (typeof volume === 'number' ? volume : 0),
      link: `https://trends.google.com/trends/explore?date=now%201-d&geo=BR&q=${encodeURIComponent(t.query)}`,
      type,
      topicType: t.categories?.[0],
      searchVolume: volume,
    });
  });

  return items;
}

export async function GET() {
  if (!SEARCHAPI_API_KEY) {
    return NextResponse.json(
      { error: 'SEARCHAPI_API_KEY não configurada. Configure em .env.local.' },
      { status: 503 }
    );
  }

  try {
    const timeRange = 'past_24_hours';
    const res = await fetchTrendingNow('BR', timeRange);
    const trends = normalizeTrends(res);

    return NextResponse.json({
      region: 'BR',
      regionLabel: 'Brasil',
      timeRange,
      trends,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar trends';
    console.error('[api/trends]', message);
    return NextResponse.json(
      { error: 'Não foi possível carregar os trends do Google. Tente mais tarde.' },
      { status: 502 }
    );
  }
}

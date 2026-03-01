import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEO_THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 horas

function getClientIp(request: NextRequest): string | null {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return null;
}

type GeoResult = { country?: string; region?: string; city?: string; lat?: number; lon?: number };

/** ip-api.com (grátis, ~45 req/min por IP) — país, região, cidade, lat, lon */
async function getGeoFromIp(ip: string): Promise<GeoResult | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.status !== 'success') return null;
        const latRaw = data.lat != null ? Number(data.lat) : NaN;
        const lonRaw = data.lon != null ? Number(data.lon) : NaN;
        const lat = Number.isFinite(latRaw) ? latRaw : undefined;
        const lon = Number.isFinite(lonRaw) ? lonRaw : undefined;
        return {
            country: data.countryCode || data.country || undefined,
            region: data.regionName || data.region || undefined,
            city: data.city || undefined,
            lat,
            lon,
        };
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.auth_user_id) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = session.user.auth_user_id;
        const account = await Account.findOne(
            { auth_user_id: authUserId },
            { geo_country: 1, geo_updated_at: 1 }
        ).lean();

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const acc = account as { geo_country?: string; geo_updated_at?: Date };
        const now = new Date();
        const hasRecentGeo =
            (acc.geo_country || acc.geo_updated_at) &&
            acc.geo_updated_at &&
            now.getTime() - new Date(acc.geo_updated_at).getTime() < GEO_THROTTLE_MS;

        if (hasRecentGeo) {
            return NextResponse.json({ success: true, skipped: true });
        }

        let ip = getClientIp(request);
        // Em localhost o IP é ::1/127.0.0.1 e o ip-api.com não devolve geo útil; em dev usamos um IP de exemplo para testar
        if (process.env.NODE_ENV === 'development' && (!ip || ip === '::1' || ip === '127.0.0.1')) {
            ip = '200.160.7.130'; // IP de exemplo (BR) para testar em localhost
        }
        const isLocalIp = !ip || ip === '::1' || ip === '127.0.0.1';

        let geo: GeoResult | null = null;
        if (!isLocalIp && ip) {
            geo = await getGeoFromIp(ip);
        }

        const update: Record<string, unknown> = {
            geo_updated_at: now,
            last_access_at: now,
        };
        if (geo) {
            if (geo.country) update.geo_country = geo.country;
            if (geo.region) update.geo_region = geo.region;
            if (geo.city) update.geo_city = geo.city;
            if (geo.lat !== undefined) update.geo_lat = geo.lat;
            if (geo.lon !== undefined) update.geo_lon = geo.lon;
        }

        // Update via coleção nativa para garantir que geo_lat/geo_lon sejam gravados (evita cache do schema Mongoose)
        const conn = await connectMongo();
        const db = conn.connection.db;
        if (!db) throw new Error('MongoDB db not available');
        const coll = db.collection('accounts');
        await coll.updateOne(
            { auth_user_id: authUserId },
            { $set: update }
        );

        return NextResponse.json({
            success: true,
            geo: geo
                ? {
                      country: geo.country,
                      region: geo.region,
                      city: geo.city,
                      lat: geo.lat,
                      lon: geo.lon,
                  }
                : null,
        });
    } catch (error) {
        console.error('Erro ao atualizar geo da conta:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

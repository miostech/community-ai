import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import MarcaPresentationLead from '@/models/MarcaPresentationLead';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidEmail(s: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const person_name = typeof body.person_name === 'string' ? body.person_name.trim() : '';
        const brand_name = typeof body.brand_name === 'string' ? body.brand_name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

        if (!person_name || person_name.length < 2) {
            return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 });
        }
        if (!brand_name || brand_name.length < 2) {
            return NextResponse.json({ error: 'Informe o nome da marca.' }, { status: 400 });
        }
        if (!email || !isValidEmail(email)) {
            return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
        }

        await connectMongo();
        await MarcaPresentationLead.create({
            person_name,
            brand_name,
            email,
            source: 'lp_agendar_apresentacao',
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('marca-apresentacao lead:', e);
        return NextResponse.json({ error: 'Não foi possível salvar. Tente novamente.' }, { status: 500 });
    }
}

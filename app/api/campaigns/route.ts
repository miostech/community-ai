import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Campaign from '@/models/Campaign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Listar campanhas ativas (para a vitrine de creators)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const category = searchParams.get('category');
        const niche = searchParams.get('niche');
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = { status: 'active' };

        if (category) filter.category = category;
        if (niche) filter.niches = niche;

        const [campaigns, total] = await Promise.all([
            Campaign.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Campaign.countDocuments(filter),
        ]);

        return NextResponse.json({
            campaigns,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Erro ao listar campanhas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// POST - Criar campanha (admin ou marca)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const body = await request.json();

        const requiredFields = ['brand_name', 'title', 'description', 'briefing', 'slots'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Campo obrigatório: ${field}` },
                    { status: 400 }
                );
            }
        }

        const campaign = await Campaign.create({
            brand_account_id: body.brand_account_id || null,
            brand_name: body.brand_name,
            brand_logo: body.brand_logo,
            brand_website: body.brand_website,
            brand_instagram: body.brand_instagram,
            title: body.title,
            description: body.description,
            briefing: body.briefing,
            content_type: body.content_type || 'ugc',
            content_usage: body.content_usage || 'redes_marca',
            category: body.category,
            niches: body.niches || [],
            filters: body.filters || {},
            slots: body.slots,
            budget_per_creator: body.budget_per_creator,
            includes_product: body.includes_product || false,
            product_description: body.product_description,
            deliverables: body.deliverables || [],
            application_deadline: body.application_deadline,
            content_deadline: body.content_deadline,
            start_date: body.start_date,
            status: body.status || 'draft',
            images: body.images || [],
        });

        return NextResponse.json({ success: true, campaign }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

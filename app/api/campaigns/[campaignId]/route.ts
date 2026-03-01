import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Campaign from '@/models/Campaign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Detalhes de uma campanha
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { campaignId } = await params;

        await connectMongo();

        const campaign = await Campaign.findById(campaignId).lean();

        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error('Erro ao buscar campanha:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// PATCH - Atualizar campanha
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { campaignId } = await params;
        const body = await request.json();

        await connectMongo();

        const allowedFields = [
            'brand_name', 'brand_logo', 'brand_website', 'brand_instagram',
            'title', 'description', 'briefing',
            'content_type', 'content_usage',
            'category', 'niches', 'filters',
            'slots', 'budget_per_creator',
            'includes_product', 'product_description',
            'deliverables',
            'application_deadline', 'content_deadline', 'start_date',
            'status', 'images',
        ];

        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }

        const campaign = await Campaign.findByIdAndUpdate(
            campaignId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();

        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        console.error('Erro ao atualizar campanha:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

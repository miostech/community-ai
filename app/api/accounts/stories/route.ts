import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import AccountModel from '@/models/Account';

export async function GET() {
    try {
        await connectMongo();

        // Buscar accounts ordenados pelo último acesso (mais recentes primeiro)
        const accounts = await AccountModel.find({})
            .select('_id first_name last_name avatar_url link_instagram link_tiktok link_youtube primary_social_link last_access_at')
            .sort({ last_access_at: -1 })
            .limit(20)
            .lean();

        // Transformar para o formato esperado pelo Stories
        const storyUsers = accounts.map((account) => {
            const fullName = account.last_name
                ? `${account.first_name} ${account.last_name}`.trim()
                : account.first_name;

            const nameParts = fullName.split(' ');
            const initials = nameParts.length >= 2
                ? (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
                : fullName.slice(0, 2).toUpperCase();

            return {
                id: account._id.toString(),
                name: fullName,
                avatar: account.avatar_url || null,
                initials,
                interactionCount: 0, // Pode ser calculado depois se necessário
                instagramProfile: account.link_instagram || undefined,
                tiktokProfile: account.link_tiktok || undefined,
                youtubeProfile: account.link_youtube || undefined,
                primarySocialLink: account.primary_social_link || null,
            };
        });

        return NextResponse.json(storyUsers);
    } catch (error) {
        console.error('Erro ao buscar accounts para stories:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar usuários' },
            { status: 500 }
        );
    }
}

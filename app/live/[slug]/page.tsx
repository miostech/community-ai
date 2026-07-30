import { redirect, notFound } from 'next/navigation';
import { connectMongo } from '@/lib/mongoose';
import LiveEvent from '@/models/LiveEvent';

export const dynamic = 'force-dynamic';

export default async function LiveRedirectPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    await connectMongo();

    const event = await LiveEvent.findOne({ slug })
        .select('_id')
        .lean() as { _id: { toString(): string } } | null;

    if (!event) notFound();

    redirect(`/dashboard/lives/${event._id.toString()}`);
}

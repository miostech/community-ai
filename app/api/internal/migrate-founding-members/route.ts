import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOUNDING_START = new Date('2026-02-23T00:00:00.000Z');
const FOUNDING_END = new Date('2026-03-09T00:00:00.000Z');

export async function POST() {
    try {
        await connectMongo();

        const paidInPeriod = await AccountPayment.find({
            order_status: 'paid',
            kiwify_created_at: { $gte: FOUNDING_START, $lt: FOUNDING_END },
        })
            .select('email')
            .lean();

        const uniqueEmails = [
            ...new Set(
                paidInPeriod
                    .map((p: any) => (p.email as string)?.toLowerCase().trim())
                    .filter(Boolean)
            ),
        ];

        if (uniqueEmails.length === 0) {
            return NextResponse.json({ message: 'Nenhum pagamento encontrado no período fundador', updated: 0 });
        }

        const refundedEmails = new Set(
            (
                await AccountPayment.find({
                    email: { $in: uniqueEmails },
                    order_status: { $in: ['refunded', 'chargeback'] },
                })
                    .select('email')
                    .lean()
            ).map((p: any) => (p.email as string)?.toLowerCase().trim())
        );

        const cancelledEmails = new Set(
            (
                await AccountPayment.find({
                    email: { $in: uniqueEmails },
                    'subscription.status': { $in: ['cancelled', 'cancelado', 'canceled'] },
                })
                    .select('email')
                    .lean()
            ).map((p: any) => (p.email as string)?.toLowerCase().trim())
        );

        const qualifyingEmails = uniqueEmails.filter(
            (e) => !refundedEmails.has(e) && !cancelledEmails.has(e)
        );

        const disqualifiedEmails = uniqueEmails.filter(
            (e) => refundedEmails.has(e) || cancelledEmails.has(e)
        );

        const setTrue = await Account.updateMany(
            { email: { $in: qualifyingEmails } },
            { $set: { is_founding_member: true } }
        );

        let setFalseCount = 0;
        if (disqualifiedEmails.length > 0) {
            const setFalse = await Account.updateMany(
                { email: { $in: disqualifiedEmails }, is_founding_member: true },
                { $set: { is_founding_member: false } }
            );
            setFalseCount = setFalse.modifiedCount;
        }

        return NextResponse.json({
            message: 'Migração concluída',
            totalPaidInPeriod: uniqueEmails.length,
            qualifying: qualifyingEmails.length,
            disqualified: disqualifiedEmails.length,
            updatedToTrue: setTrue.modifiedCount,
            updatedToFalse: setFalseCount,
        });
    } catch (error) {
        console.error('Erro na migração founding members:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

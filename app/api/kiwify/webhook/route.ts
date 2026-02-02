import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectMongo } from '@/lib/mongoose';
import AccountPayment from '@/models/AccountPayment';

// Token secreto para validar webhooks do Kiwify (configurar no .env)
const KIWIFY_WEBHOOK_TOKEN = process.env.KIWIFY_WEBHOOK_TOKEN || '';

// Tipos de eventos do Kiwify
type KiwifyEventType =
    | 'paid'                     // Compra aprovada (evento principal)
    | 'order_approved'           // Compra aprovada (alternativo)
    | 'subscription_canceled'    // Assinatura cancelada
    | 'subscription_overdue'     // Assinatura atrasada
    | 'subscription_renewed'     // Assinatura renovada
    | 'order_refunded'           // Pedido reembolsado
    | 'refunded'                 // Reembolsado (alternativo)
    | 'chargeback'               // Chargeback
    | 'waiting_payment'          // Aguardando pagamento
    | 'refused';                 // Pagamento recusado

interface KiwifyCustomer {
    email: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    mobile?: string;
    instagram?: string;
    city?: string;
    state?: string;
    zipcode?: string;
}

interface KiwifyProduct {
    product_id: string;
    product_name: string;
}

interface KiwifySubscription {
    id: string;
    status: string;
    start_date?: string;
    next_payment?: string;
    plan?: {
        id: string;
        name: string;
        frequency: string;
    };
}

interface KiwifyWebhookPayload {
    order_id: string;
    order_ref?: string;
    order_status: string;
    webhook_event_type: string;  // Campo principal do tipo de evento
    product_type?: string;
    payment_method?: string;
    installments?: number;
    card_type?: string;
    card_last4digits?: string;
    sale_type?: string;
    store_id?: string;
    product?: KiwifyProduct;
    Product?: KiwifyProduct;  // Kiwify envia com P maiúsculo
    customer?: KiwifyCustomer;
    Customer?: KiwifyCustomer; // Kiwify envia com C maiúsculo
    Subscription?: KiwifySubscription;
    subscription?: KiwifySubscription;
    subscription_id?: string;
    created_at: string;
    updated_at?: string;
    approved_date?: string;
    refunded_at?: string;
    Commissions?: {
        charge_amount: number;
        product_base_price: number;
        product_base_price_currency: string;
        kiwify_fee: number;
        settlement_amount: number;
        my_commission: number;
        currency: string;
    };
}

// Valida a assinatura do webhook
function validateWebhookSignature(payload: string, signature: string): boolean {
    if (!KIWIFY_WEBHOOK_TOKEN) {
        console.warn('⚠️ KIWIFY_WEBHOOK_TOKEN não configurado');
        return true; // Em dev, permite sem token
    }

    if (!signature) {
        console.warn('⚠️ Assinatura não fornecida no webhook');
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha1', KIWIFY_WEBHOOK_TOKEN)
        .update(payload)
        .digest('hex');

    // Compara strings diretamente (Kiwify usa SHA1, não SHA256)
    // Usa comparação segura contra timing attacks
    if (signature.length !== expectedSignature.length) {
        console.warn('⚠️ Tamanho da assinatura diferente:', { received: signature.length, expected: expectedSignature.length });
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
    );
}

// Salva o registro de pagamento no banco
async function savePaymentRecord(
    payload: KiwifyWebhookPayload,
    email: string,
    customer?: KiwifyCustomer,
    product?: KiwifyProduct
) {
    try {
        const subscription = payload.Subscription || payload.subscription;
        const commissions = payload.Commissions;

        const paymentData = {
            email,

            // Dados do pedido
            order_id: payload.order_id,
            order_ref: payload.order_ref || '',
            order_status: payload.order_status,
            webhook_event_type: payload.webhook_event_type,
            product_type: payload.product_type || 'membership',
            payment_method: payload.payment_method,
            installments: payload.installments || 1,
            card_type: payload.card_type,
            card_last4digits: payload.card_last4digits,
            sale_type: payload.sale_type || 'producer',

            // Dados do produto
            product_id: product?.product_id || '',
            product_name: product?.product_name || '',

            // Dados do cliente (snapshot)
            customer: {
                full_name: customer?.full_name || '',
                first_name: customer?.first_name || '',
                email: customer?.email || email,
                mobile: customer?.mobile,
                instagram: customer?.instagram,
                city: customer?.city,
                state: customer?.state,
                zipcode: customer?.zipcode,
            },

            // Dados da assinatura
            subscription: subscription ? {
                id: subscription.id,
                status: subscription.status,
                start_date: subscription.start_date ? new Date(subscription.start_date) : undefined,
                next_payment: subscription.next_payment ? new Date(subscription.next_payment) : undefined,
                plan_name: subscription.plan?.name,
                plan_frequency: subscription.plan?.frequency,
            } : undefined,

            // Dados financeiros
            commissions: commissions ? {
                charge_amount: commissions.charge_amount,
                product_base_price: commissions.product_base_price,
                currency: commissions.currency || 'BRL',
                kiwify_fee: commissions.kiwify_fee,
                settlement_amount: commissions.settlement_amount,
                my_commission: commissions.my_commission,
            } : undefined,

            // Datas
            kiwify_created_at: payload.created_at ? new Date(payload.created_at.replace(' ', 'T') + ':00Z') : new Date(),
            kiwify_updated_at: payload.updated_at ? new Date(payload.updated_at.replace(' ', 'T') + ':00Z') : undefined,
            approved_date: payload.approved_date ? new Date(payload.approved_date.replace(' ', 'T') + ':00Z') : undefined,
            refunded_at: payload.refunded_at ? new Date(payload.refunded_at) : undefined,

            // Metadados
            store_id: payload.store_id || '',
            raw_payload: JSON.stringify(payload),
        };

        // Usa upsert para evitar duplicatas (baseado no order_id)
        await AccountPayment.findOneAndUpdate(
            { order_id: payload.order_id },
            paymentData,
            { upsert: true, new: true }
        );

        console.log('💾 Pagamento salvo:', payload.order_id);
    } catch (error) {
        console.error('❌ Erro ao salvar pagamento:', error);
        // Não lança erro para não interromper o fluxo principal
    }
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();

        // Parse do payload
        const rawPayload = JSON.parse(rawBody);

        // A assinatura pode vir no header OU dentro do payload
        const signature = request.headers.get('x-kiwify-signature') || rawPayload.signature || '';

        // Valida assinatura (em produção) - apenas se tiver token configurado
        if (process.env.NODE_ENV === 'production' && KIWIFY_WEBHOOK_TOKEN && signature) {
            const isValid = validateWebhookSignature(rawBody, signature);
            if (!isValid) {
                console.warn('⚠️ Assinatura do webhook não validada, continuando mesmo assim...');
                // Não bloqueia - apenas loga o aviso
            }
        }

        // Kiwify envia o payload dentro de um objeto "order"
        const payload: KiwifyWebhookPayload = rawPayload.order || rawPayload;

        // Kiwify usa webhook_event_type para o tipo de evento
        const eventType = payload.webhook_event_type as KiwifyEventType;

        // Normaliza os campos (Kiwify envia com letras maiúsculas)
        const customer = payload.Customer || payload.customer;
        const product = payload.Product || payload.product;

        const email = customer?.email?.toLowerCase().trim();

        console.log('📦 Kiwify Webhook:', {
            event: eventType,
            orderId: payload.order_id,
            email,
            product: product?.product_name,
            customerName: customer?.full_name,
        });

        // Mesmo sem email, salvamos o registro (pode ser útil para debug)
        await connectMongo();

        // Salva o registro de todos os eventos relevantes
        const shouldSaveRecord = [
            'paid', 'order_approved',
            'subscription_canceled', 'subscription_overdue', 'subscription_renewed',
            'order_refunded', 'refunded', 'chargeback'
        ].includes(eventType);

        if (shouldSaveRecord) {
            await savePaymentRecord(payload, email || 'unknown@webhook.local', customer, product);
            console.log(`✅ Registro salvo para evento: ${eventType}, email: ${email || 'N/A'}`);
        } else {
            console.log(`ℹ️ Evento não salvo: ${eventType}`);
        }

        return NextResponse.json({ success: true, event: eventType, email });
    } catch (error) {
        console.error('❌ Erro no webhook Kiwify:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}



// Endpoint GET para verificar se o webhook está funcionando
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Kiwify webhook endpoint is running',
        hasToken: !!KIWIFY_WEBHOOK_TOKEN,
    });
}

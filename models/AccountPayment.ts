import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccountPayment extends Document {
    // Referência à conta do usuário
    account_id?: mongoose.Types.ObjectId;
    email: string;

    // Dados do pedido
    order_id: string;
    order_ref: string;
    order_status: string;
    webhook_event_type: string;
    product_type: string;
    payment_method: string;
    installments: number;
    card_type?: string;
    card_last4digits?: string;
    sale_type: string;

    // Dados do produto
    product_id: string;
    product_name: string;

    // Dados do cliente (snapshot no momento da compra)
    customer: {
        full_name: string;
        first_name: string;
        email: string;
        mobile?: string;
        instagram?: string;
        city?: string;
        state?: string;
        zipcode?: string;
    };

    // Dados da assinatura (se houver)
    subscription?: {
        id: string;
        status: string;
        start_date?: Date;
        next_payment?: Date;
        plan_name?: string;
        plan_frequency?: string;
    };

    // Dados financeiros
    commissions: {
        charge_amount: number;
        product_base_price: number;
        currency: string;
        kiwify_fee: number;
        settlement_amount: number;
        my_commission: number;
    };

    // Datas
    kiwify_created_at: Date;
    kiwify_updated_at?: Date;
    approved_date?: Date;
    refunded_at?: Date;

    // Metadados
    store_id: string;
    raw_payload?: string; // JSON completo para debug/auditoria

    createdAt: Date;
    updatedAt: Date;
}

const AccountPaymentSchema = new Schema<IAccountPayment>(
    {
        // Referência à conta
        account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        // Dados do pedido
        order_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        order_ref: {
            type: String,
            required: true,
        },
        order_status: {
            type: String,
            required: true,
            enum: ['paid', 'refunded', 'chargeback', 'waiting_payment', 'refused'],
        },
        webhook_event_type: {
            type: String,
            required: true,
        },
        product_type: {
            type: String,
            default: 'membership',
        },
        payment_method: {
            type: String,
            enum: ['credit_card', 'pix', 'boleto'],
        },
        installments: {
            type: Number,
            default: 1,
        },
        card_type: String,
        card_last4digits: String,
        sale_type: {
            type: String,
            default: 'producer',
        },

        // Dados do produto
        product_id: {
            type: String,
            required: true,
            index: true,
        },
        product_name: {
            type: String,
            required: true,
        },

        // Dados do cliente
        customer: {
            full_name: String,
            first_name: String,
            email: String,
            mobile: String,
            instagram: String,
            city: String,
            state: String,
            zipcode: String,
        },

        // Dados da assinatura
        subscription: {
            id: String,
            status: String,
            start_date: Date,
            next_payment: Date,
            plan_name: String,
            plan_frequency: String,
        },

        // Dados financeiros
        commissions: {
            charge_amount: Number,
            product_base_price: Number,
            currency: { type: String, default: 'BRL' },
            kiwify_fee: Number,
            settlement_amount: Number,
            my_commission: Number,
        },

        // Datas do Kiwify
        kiwify_created_at: Date,
        kiwify_updated_at: Date,
        approved_date: Date,
        refunded_at: Date,

        // Metadados
        store_id: String,
        raw_payload: String,
    },
    {
        timestamps: true, // createdAt e updatedAt automáticos
    }
);

// Índices compostos para queries comuns
AccountPaymentSchema.index({ email: 1, createdAt: -1 });
AccountPaymentSchema.index({ account_id: 1, createdAt: -1 });
AccountPaymentSchema.index({ order_status: 1, createdAt: -1 });

// Método estático para buscar pagamentos de um usuário
AccountPaymentSchema.statics.findByEmail = function (email: string) {
    return this.find({ email: email.toLowerCase().trim() }).sort({ createdAt: -1 });
};

// Método estático para buscar último pagamento aprovado
AccountPaymentSchema.statics.findLastApproved = function (email: string) {
    return this.findOne({
        email: email.toLowerCase().trim(),
        order_status: 'paid',
    }).sort({ createdAt: -1 });
};

const AccountPayment: Model<IAccountPayment> =
    mongoose.models.AccountPayment ||
    mongoose.model<IAccountPayment>('AccountPayment', AccountPaymentSchema);

export default AccountPayment;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAbandonedCheckout extends Document {
    checkout_id: string;
    email: string;
    name: string;
    phone?: string;
    cpf?: string;
    country?: string;
    product_id: string;
    product_name: string;
    checkout_link?: string;
    offer_name?: string | null;
    store_id?: string;
    subscription_plan?: string | null;
    status: 'abandoned' | 'paid';
    paid_at?: Date;
    kiwify_created_at: Date;
    raw_payload?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AbandonedCheckoutSchema = new Schema<IAbandonedCheckout>(
    {
        checkout_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        name: { type: String, required: true },
        phone: String,
        cpf: String,
        country: String,
        product_id: { type: String, required: true, index: true },
        product_name: { type: String, required: true },
        checkout_link: String,
        offer_name: { type: String, default: null },
        store_id: String,
        subscription_plan: { type: String, default: null },
        status: {
            type: String,
            enum: ['abandoned', 'paid'],
            default: 'abandoned',
            index: true,
        },
        paid_at: Date,
        kiwify_created_at: { type: Date, required: true, index: true },
        raw_payload: String,
    },
    { timestamps: true }
);

AbandonedCheckoutSchema.index({ email: 1, kiwify_created_at: -1 });
AbandonedCheckoutSchema.index({ email: 1, product_id: 1, status: 1 });

const AbandonedCheckout: Model<IAbandonedCheckout> =
    mongoose.models.AbandonedCheckout ||
    mongoose.model<IAbandonedCheckout>('AbandonedCheckout', AbandonedCheckoutSchema);

export default AbandonedCheckout;

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/** Registro idempotente por sessão Stripe — evita crédito duplicado no webhook. */
export interface IWalletStripeTopUp extends Document {
    stripe_session_id: string;
    account_id: Types.ObjectId;
    credited_cents: number;
    amount_paid_cents: number;
    created_at: Date;
}

const WalletStripeTopUpSchema = new Schema(
    {
        stripe_session_id: { type: String, required: true, unique: true, index: true },
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
        credited_cents: { type: Number, required: true, min: 1 },
        amount_paid_cents: { type: Number, required: true, min: 1 },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        versionKey: false,
    }
);

const WalletStripeTopUpModel: Model<IWalletStripeTopUp> =
    mongoose.models.WalletStripeTopUp ??
    mongoose.model<IWalletStripeTopUp>('WalletStripeTopUp', WalletStripeTopUpSchema);

export default WalletStripeTopUpModel;

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/**
 * Perfil comercial da marca (separado da conta de usuário pessoal).
 * Um documento por conta (account_id único).
 */
export interface IBusinessAccount extends Document {
    _id: Types.ObjectId;
    account_id: Types.ObjectId;
    brand_logo_url?: string;
    brand_description?: string;
    /** Saldo em centavos BRL (carteira da marca no portal) */
    wallet_balance_cents: number;
    created_at: Date;
    updated_at: Date;
}

const BusinessAccountSchema = new Schema(
    {
        account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            unique: true,
            index: true,
        },
        brand_logo_url: { type: String, trim: true },
        brand_description: { type: String, trim: true, maxlength: 1000 },
        wallet_balance_cents: { type: Number, default: 0, min: 0 },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
    }
);

const BusinessAccountModel: Model<IBusinessAccount> =
    mongoose.models.BusinessAccount ??
    mongoose.model<IBusinessAccount>('BusinessAccount', BusinessAccountSchema);

export default BusinessAccountModel;

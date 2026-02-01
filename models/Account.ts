import mongoose, { InferSchemaType, Model, Schema } from 'mongoose';

const AccountSchema = new Schema(
    {
        first_name: { type: String, required: true, trim: true },
        last_name: { type: String, trim: true, default: '' },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
        phone_country_code: { type: String, trim: true, default: '+55' },
        auth_user_id: { type: String, required: true, unique: true, index: true, trim: true },
        provider_oauth: { type: String, enum: ['google', 'apple', 'facebook'], trim: true },
        link_instagram: { type: String, trim: true },
        link_tiktok: { type: String, trim: true },
        primary_social_link: { type: String, enum: ['instagram', 'tiktok', null], default: null },
        avatar_url: { type: String, trim: true },
        background_url: { type: String, trim: true },
        code_invite: { type: String, unique: true, sparse: true, trim: true },
        code_invite_ref: { type: String, trim: true },
        plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
        plan_expire_at: { type: Date },
        total_tokens_used: { type: Number, default: 0 },
        total_tokens_used_in_current_month: { type: Number, default: 0 },
        total_tokens_used_current_week: { type: Number, default: 0 },
        utm_ref: { type: String, trim: true },
        last_access_at: { type: Date, default: Date.now },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
    }
);

export type Account = InferSchemaType<typeof AccountSchema>;

const AccountModel: Model<Account> =
    mongoose.models.Account ?? mongoose.model<Account>('Account', AccountSchema);

export default AccountModel;

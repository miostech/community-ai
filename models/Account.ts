import mongoose, { Model, Schema, Types } from 'mongoose';

export interface Account {
    _id: Types.ObjectId;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    phone_country_code: string;
    auth_user_id: string;
    provider_oauth?: 'google' | 'apple' | 'facebook' | 'kiwify';
    link_instagram?: string;
    link_tiktok?: string;
    link_youtube?: string;
    primary_social_link?: 'instagram' | 'tiktok' | 'youtube' | null;
    avatar_url?: string;
    used_instagram_avatar: boolean;
    /** Data/hora do último uso do botão "Usar foto do Instagram". Botão só reaparece após 24h. */
    instagram_avatar_used_at?: Date;
    background_url?: string;
    code_invite?: string;
    code_invite_ref?: string;
    plan: 'free' | 'pro' | 'enterprise';
    plan_expire_at?: Date;
    total_tokens_used: number;
    total_tokens_used_in_current_month: number;
    total_tokens_used_current_week: number;
    utm_ref?: string;
    last_access_at: Date;
    last_notifications_read_at?: Date | null;
    password_hash?: string;
    /** Total de seguidores (soma das redes) no momento do cadastro/primeira captura — para monitorar crescimento e premiações */
    followers_at_signup?: number | null;
    created_at: Date;
    updated_at: Date;
}

const AccountSchema = new Schema(
    {
        first_name: { type: String, required: true, trim: true },
        last_name: { type: String, trim: true, default: '' },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
        phone_country_code: { type: String, trim: true, default: '+55' },
        auth_user_id: { type: String, required: true, unique: true, index: true, trim: true },
        provider_oauth: { type: String, enum: ['google', 'apple', 'facebook', 'kiwify'], trim: true },
        link_instagram: { type: String, trim: true },
        link_tiktok: { type: String, trim: true },
        link_youtube: { type: String, trim: true },
        primary_social_link: { type: String, enum: ['instagram', 'tiktok', 'youtube', null], default: null },
        avatar_url: { type: String, trim: true },
        used_instagram_avatar: { type: Boolean, default: false },
        instagram_avatar_used_at: { type: Date },
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
        last_notifications_read_at: { type: Date, default: null },
        /** Hash da senha (apenas para contas com provider_oauth === 'kiwify') */
        password_hash: { type: String, trim: true, select: false },
        /** Total de seguidores (soma das redes) no momento do cadastro/primeira captura */
        followers_at_signup: { type: Number, default: null },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
    }
);

const AccountModel: Model<Account> =
    mongoose.models.Account ?? mongoose.model<Account>('Account', AccountSchema);

export default AccountModel;

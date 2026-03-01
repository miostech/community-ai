import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICampaignApplication extends Document {
    _id: Types.ObjectId;
    campaign_id: Types.ObjectId;
    creator_account_id: Types.ObjectId;

    /** Mensagem do creator explicando por que é ideal para a campanha */
    pitch: string;

    /** Proposta de como criaria o conteúdo */
    content_proposal?: string;

    /** Se o creator já é cliente/usa o produto da marca */
    is_customer: boolean;

    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

    /** Notas internas da marca sobre o creator */
    brand_notes?: string;

    /** Motivo da rejeição (visível ao creator) */
    rejection_reason?: string;

    /** Entregas do creator */
    deliveries: {
        type: string;
        url: string;
        submitted_at: Date;
        status: 'pending_review' | 'approved' | 'revision_requested';
        feedback?: string;
    }[];

    /** Datas de mudança de status */
    approved_at?: Date;
    rejected_at?: Date;
    completed_at?: Date;

    created_at: Date;
    updated_at: Date;
}

const DeliverySchema = new Schema(
    {
        type: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        submitted_at: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['pending_review', 'approved', 'revision_requested'],
            default: 'pending_review',
        },
        feedback: { type: String, trim: true },
    },
    { _id: true }
);

const CampaignApplicationSchema = new Schema<ICampaignApplication>(
    {
        campaign_id: {
            type: Schema.Types.ObjectId,
            ref: 'Campaign',
            required: true,
            index: true,
        },
        creator_account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },

        pitch: { type: String, required: true, trim: true, maxlength: 2000 },
        content_proposal: { type: String, trim: true, maxlength: 3000 },
        is_customer: { type: Boolean, default: false },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },

        brand_notes: { type: String, trim: true },
        rejection_reason: { type: String, trim: true },

        deliveries: { type: [DeliverySchema], default: [] },

        approved_at: { type: Date },
        rejected_at: { type: Date },
        completed_at: { type: Date },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
    }
);

CampaignApplicationSchema.index({ campaign_id: 1, creator_account_id: 1 }, { unique: true });
CampaignApplicationSchema.index({ creator_account_id: 1, status: 1, created_at: -1 });
CampaignApplicationSchema.index({ campaign_id: 1, status: 1, created_at: -1 });

const CampaignApplicationModel: Model<ICampaignApplication> =
    mongoose.models.CampaignApplication ??
    mongoose.model<ICampaignApplication>('CampaignApplication', CampaignApplicationSchema);

export default CampaignApplicationModel;

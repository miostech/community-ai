import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICampaign extends Document {
    _id: Types.ObjectId;
    /** Conta da marca que criou a campanha (null = criada por admin) */
    brand_account_id?: Types.ObjectId;
    brand_name: string;
    brand_logo?: string;
    brand_website?: string;
    brand_instagram?: string;

    title: string;
    description: string;
    briefing: string;

    /** Tipo de conteúdo esperado */
    content_type: 'ugc' | 'reels' | 'stories' | 'tiktok' | 'post_feed' | 'outro';
    /** Onde o conteúdo será usado */
    content_usage: 'redes_marca' | 'anuncios' | 'ambos';

    category: string;
    niches: string[];
    /** Requisitos de filtro para creators */
    filters: {
        gender?: 'masculino' | 'feminino' | 'todos';
        min_age?: number;
        max_age?: number;
        countries?: string[];
        states?: string[];
        cities?: string[];
        min_followers?: number;
        max_followers?: number;
    };

    /** Número de vagas para creators */
    slots: number;
    /** Vagas já preenchidas (desnormalizado) */
    slots_filled: number;

    /** Valor oferecido por creator (em centavos BRL) — usado quando payment_type é per_post */
    budget_per_creator?: number;
    /** Tipo de pagamento em campanhas pagas: por post fixo ou por visualizações */
    payment_type?: 'per_post' | 'per_views';
    /** Valor pago a cada 1.000 visualizações (em centavos BRL) — usado quando payment_type é per_views */
    budget_per_1000_views?: number;
    /** Inclui produto grátis */
    includes_product: boolean;
    product_description?: string;

    /** Entregas esperadas do creator */
    deliverables: string[];

    /** Datas */
    application_deadline?: Date;
    content_deadline?: Date;
    start_date?: Date;

    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

    /** Contadores desnormalizados */
    applications_count: number;

    /** Imagens/referências da campanha */
    images: string[];

    created_at: Date;
    updated_at: Date;
}

const CampaignSchema = new Schema<ICampaign>(
    {
        brand_account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            index: true,
        },
        brand_name: { type: String, required: true, trim: true },
        brand_logo: { type: String, trim: true },
        brand_website: { type: String, trim: true },
        brand_instagram: { type: String, trim: true },

        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, required: true, trim: true, maxlength: 5000 },
        briefing: { type: String, required: true, trim: true, maxlength: 10000 },

        content_type: {
            type: String,
            enum: ['ugc', 'reels', 'stories', 'tiktok', 'post_feed', 'outro'],
            default: 'ugc',
        },
        content_usage: {
            type: String,
            enum: ['redes_marca', 'anuncios', 'ambos'],
            default: 'redes_marca',
        },

        category: { type: String, trim: true, index: true },
        niches: { type: [String], default: [], index: true },
        filters: {
            gender: { type: String, enum: ['masculino', 'feminino', 'todos'] },
            min_age: { type: Number },
            max_age: { type: Number },
            countries: { type: [String], default: [] },
            states: { type: [String], default: [] },
            cities: { type: [String], default: [] },
            min_followers: { type: Number },
            max_followers: { type: Number },
        },

        slots: { type: Number, required: true, min: 1 },
        slots_filled: { type: Number, default: 0, min: 0 },

        budget_per_creator: { type: Number },
        payment_type: { type: String, enum: ['per_post', 'per_views'], trim: true },
        budget_per_1000_views: { type: Number },
        includes_product: { type: Boolean, default: false },
        product_description: { type: String, trim: true },

        deliverables: { type: [String], default: [] },

        application_deadline: { type: Date },
        content_deadline: { type: Date },
        start_date: { type: Date },

        status: {
            type: String,
            enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
            default: 'draft',
            index: true,
        },

        applications_count: { type: Number, default: 0, min: 0 },

        images: { type: [String], default: [] },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
    }
);

CampaignSchema.index({ status: 1, created_at: -1 });
CampaignSchema.index({ status: 1, application_deadline: 1 });
CampaignSchema.index({ category: 1, status: 1 });
CampaignSchema.index({ niches: 1, status: 1 });

const CampaignModel: Model<ICampaign> =
    mongoose.models.Campaign ?? mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default CampaignModel;

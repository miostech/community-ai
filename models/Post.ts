import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReport {
    reporter_id: Types.ObjectId;
    reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
    description?: string;
    created_at: Date;
}

export interface IPost extends Document {
    _id: Types.ObjectId;
    author_id: Types.ObjectId;
    content: string;
    images: string[];
    video_url?: string;

    // Links para as redes sociais (do post específico)
    link_instagram_post?: string;
    link_tiktok_post?: string;
    link_youtube_post?: string;

    // Organização
    category: 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral' | 'atualizacao' | 'suporte';
    media_type: 'text' | 'image' | 'video';
    tags: string[];
    is_pinned: boolean;

    // Contadores (desnormalizados para performance)
    likes_count: number;
    comments_count: number;

    // Visibilidade & Status
    status: 'draft' | 'published' | 'archived';
    visibility: 'public' | 'members' | 'pro';

    // Moderação
    is_approved: boolean;
    reports: IReport[];
    reports_count: number;

    // Timestamps
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
}

const ReportSchema = new Schema<IReport>(
    {
        reporter_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        reason: {
            type: String,
            enum: ['spam', 'inappropriate', 'harassment', 'misinformation', 'other'],
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const PostSchema = new Schema<IPost>(
    {
        author_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: false,
            trim: true,
            maxlength: 5000,
            default: '',
        },
        images: {
            type: [String],
            default: [],
            validate: {
                validator: (v: string[]) => v.length <= 10,
                message: 'Máximo de 10 imagens por post',
            },
        },
        video_url: {
            type: String,
            trim: true,
        },

        // Links para as redes sociais (do post específico)
        link_instagram_post: {
            type: String,
            trim: true,
        },
        link_tiktok_post: {
            type: String,
            trim: true,
        },
        link_youtube_post: {
            type: String,
            trim: true,
        },

        // Organização
        category: {
            type: String,
            enum: ['ideia', 'resultado', 'duvida', 'roteiro', 'geral', 'atualizacao', 'suporte'],
            default: 'geral',
            index: true,
        },
        media_type: {
            type: String,
            enum: ['text', 'image', 'video'],
            default: 'text',
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        is_pinned: {
            type: Boolean,
            default: false,
        },

        // Contadores
        likes_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        comments_count: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Visibilidade & Status
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'published',
            index: true,
        },
        visibility: {
            type: String,
            enum: ['public', 'members', 'pro'],
            default: 'members',
        },

        // Moderação
        is_approved: {
            type: Boolean,
            default: true, // Auto-aprovado por padrão, mudar se quiser moderação prévia
        },
        reports: {
            type: [ReportSchema],
            default: [],
        },
        reports_count: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Timestamps
        published_at: {
            type: Date,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

// Índices compostos para queries comuns
PostSchema.index({ status: 1, created_at: -1 }); // Feed principal
PostSchema.index({ author_id: 1, created_at: -1 }); // Posts de um usuário
PostSchema.index({ is_pinned: -1, created_at: -1 }); // Pinned primeiro
PostSchema.index({ tags: 1, status: 1, created_at: -1 }); // Busca por tags

// Middleware para definir published_at quando status muda para published
PostSchema.pre('save', function () {
    if (this.isModified('status') && this.status === 'published' && !this.published_at) {
        this.published_at = new Date();
    }
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

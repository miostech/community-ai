import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICommentReport {
    reporter_id: Types.ObjectId;
    reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
    description?: string;
    created_at: Date;
}

export interface IComment extends Document {
    _id: Types.ObjectId;
    post_id: Types.ObjectId;
    author_id: Types.ObjectId;
    parent_id?: Types.ObjectId; // Para respostas aninhadas

    content: string;

    // Contadores
    likes_count: number;
    replies_count: number;

    // Status
    is_edited: boolean;
    is_deleted: boolean; // Soft delete para manter thread

    // Moderação
    reports: ICommentReport[];
    reports_count: number;

    // Timestamps
    created_at: Date;
    updated_at: Date;
}

const CommentReportSchema = new Schema<ICommentReport>(
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

const CommentSchema = new Schema<IComment>(
    {
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
            index: true,
        },
        author_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        parent_id: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
            index: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        // Contadores
        likes_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        replies_count: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Status
        is_edited: {
            type: Boolean,
            default: false,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },

        // Moderação
        reports: {
            type: [CommentReportSchema],
            default: [],
        },
        reports_count: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

// Índices para queries comuns
CommentSchema.index({ post_id: 1, created_at: 1 }); // Comentários de um post (cronológico)
CommentSchema.index({ post_id: 1, parent_id: 1, created_at: 1 }); // Respostas de um comentário
CommentSchema.index({ author_id: 1, created_at: -1 }); // Comentários de um usuário

// Middleware para marcar como editado
CommentSchema.pre('save', function (next) {
    if (this.isModified('content') && !this.isNew) {
        this.is_edited = true;
    }
    next();
});

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

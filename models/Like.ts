import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILike extends Document {
    _id: Types.ObjectId;
    user_id: Types.ObjectId;
    target_type: 'post' | 'comment' | 'story';
    target_id: Types.ObjectId;
    created_at: Date;
}

const LikeSchema = new Schema<ILike>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        target_type: {
            type: String,
            enum: ['post', 'comment', 'story'],
            required: true,
        },
        target_id: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: false, // Likes não são editados
        },
    }
);

// Índice único para evitar likes duplicados
LikeSchema.index({ user_id: 1, target_type: 1, target_id: 1 }, { unique: true });

// Índices para queries comuns
LikeSchema.index({ target_type: 1, target_id: 1 }); // Todos os likes de um post/comment
LikeSchema.index({ user_id: 1, target_type: 1, created_at: -1 }); // "Posts que curti"

export default mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);

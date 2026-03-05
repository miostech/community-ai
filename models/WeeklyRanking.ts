import mongoose, { Model, Schema, Types } from 'mongoose';

export interface WeeklyRanking {
    _id: Types.ObjectId;
    account_id: Types.ObjectId;
    account_name: string;
    account_avatar?: string;
    position: number;
    score: number;
    week_start: Date;
    week_end: Date;
    stats: {
        likesGiven: number;
        likesReceived: number;
        postsCount: number;
        commentsCount: number;
    };
    created_at: Date;
}

const WeeklyRankingSchema = new Schema(
    {
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
        account_name: { type: String, required: true, trim: true },
        account_avatar: { type: String, trim: true },
        position: { type: Number, required: true },
        score: { type: Number, required: true },
        week_start: { type: Date, required: true },
        week_end: { type: Date, required: true },
        stats: {
            likesGiven: { type: Number, default: 0 },
            likesReceived: { type: Number, default: 0 },
            postsCount: { type: Number, default: 0 },
            commentsCount: { type: Number, default: 0 },
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        versionKey: false,
    }
);

WeeklyRankingSchema.index({ account_id: 1, week_start: 1 }, { unique: true });
WeeklyRankingSchema.index({ position: 1, week_start: -1 });

const WeeklyRankingModel: Model<WeeklyRanking> =
    mongoose.models.WeeklyRanking ?? mongoose.model<WeeklyRanking>('WeeklyRanking', WeeklyRankingSchema);

export default WeeklyRankingModel;

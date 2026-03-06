import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPollVote extends Document {
    _id: Types.ObjectId;
    post_id: Types.ObjectId;
    account_id: Types.ObjectId;
    option_index: number; // índice em post.poll_options (0-based)
    created_at: Date;
}

const PollVoteSchema = new Schema<IPollVote>(
    {
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        option_index: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: false,
        },
    }
);

PollVoteSchema.index({ post_id: 1, account_id: 1 }, { unique: true });
PollVoteSchema.index({ post_id: 1 });

export default mongoose.models.PollVote || mongoose.model<IPollVote>('PollVote', PollVoteSchema);

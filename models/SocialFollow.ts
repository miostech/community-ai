import mongoose, { Model, Schema, Types } from 'mongoose';

export interface SocialFollow {
    _id: Types.ObjectId;
    follower_id: Types.ObjectId;
    followed_id: Types.ObjectId;
    created_at: Date;
}

const SocialFollowSchema = new Schema(
    {
        follower_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
        followed_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        versionKey: false,
    }
);

SocialFollowSchema.index({ follower_id: 1, followed_id: 1 }, { unique: true });

const SocialFollowModel: Model<SocialFollow> =
    mongoose.models.SocialFollow ?? mongoose.model<SocialFollow>('SocialFollow', SocialFollowSchema);

export default SocialFollowModel;

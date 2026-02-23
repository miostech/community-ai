import mongoose, { Model, Schema, Types } from 'mongoose';

export interface StoryViewDoc {
  _id: Types.ObjectId;
  story_id: Types.ObjectId;
  viewer_account_id: Types.ObjectId;
  viewed_at: Date;
}

const StoryViewSchema = new Schema<StoryViewDoc>(
  {
    story_id: { type: Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
    viewer_account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  },
  {
    timestamps: { createdAt: 'viewed_at', updatedAt: false },
    versionKey: false,
  }
);

StoryViewSchema.index({ story_id: 1, viewer_account_id: 1 }, { unique: true });
StoryViewSchema.index({ story_id: 1, viewed_at: -1 });

const StoryViewModel: Model<StoryViewDoc> =
  mongoose.models.StoryView ?? mongoose.model<StoryViewDoc>('StoryView', StoryViewSchema);

export default StoryViewModel;

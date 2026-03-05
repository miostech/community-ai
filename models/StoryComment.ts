import mongoose, { Model, Schema, Types } from 'mongoose';

export interface StoryCommentDoc {
  _id: Types.ObjectId;
  story_id: Types.ObjectId;
  author_id: Types.ObjectId;
  content: string;
  likes: Types.ObjectId[];
  created_at: Date;
}

const StoryCommentSchema = new Schema<StoryCommentDoc>(
  {
    story_id: { type: Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
    author_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    likes: { type: [Schema.Types.ObjectId], default: [] },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  }
);

StoryCommentSchema.index({ story_id: 1, created_at: 1 });

// Auto-expire after 24h (same lifecycle as the story itself)
StoryCommentSchema.index({ created_at: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const StoryCommentModel: Model<StoryCommentDoc> =
  mongoose.models.StoryComment ?? mongoose.model<StoryCommentDoc>('StoryComment', StoryCommentSchema);

export default StoryCommentModel;

import mongoose, { Model, Schema, Types } from 'mongoose';

/** Duração em horas até o story expirar (como Instagram) */
export const STORY_EXPIRY_HOURS = 24;

export interface StoryDoc {
  _id: Types.ObjectId;
  account_id: Types.ObjectId;
  media_url: string;
  media_type: 'image' | 'video';
  /** Texto sobre a foto/vídeo (estilo Instagram) */
  text?: string;
  /** Posição do texto em % (0-100). text_x=50, text_y=85 = centro horizontal, perto do rodapé */
  text_x?: number;
  text_y?: number;
  created_at: Date;
}

const StorySchema = new Schema<StoryDoc>(
  {
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    media_url: { type: String, required: true, trim: true },
    media_type: { type: String, enum: ['image', 'video'], required: true },
    text: { type: String, trim: true, default: '' },
    text_x: { type: Number, min: 0, max: 100 },
    text_y: { type: Number, min: 0, max: 100 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  }
);

StorySchema.index({ account_id: 1, created_at: -1 });

const StoryModel: Model<StoryDoc> =
  mongoose.models.Story ?? mongoose.model<StoryDoc>('Story', StorySchema);

export default StoryModel;

import mongoose, { Model, Schema, Types } from 'mongoose';

export interface IPushSubscription {
  _id: Types.ObjectId;
  account_id: Types.ObjectId;
  endpoint: string;
  expiration_time: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    expiration_time: {
      type: Number,
      default: null,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    user_agent: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Um mesmo endpoint pode ser re-registrado (evitar duplicatas por account_id + endpoint)
PushSubscriptionSchema.index({ account_id: 1, endpoint: 1 }, { unique: true });

const PushSubscriptionModel: Model<IPushSubscription> =
  (mongoose.models.PushSubscription as Model<IPushSubscription>) ??
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscriptionModel;

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LiveEventStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface ILiveEvent extends Document {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    cover_image_url?: string;
    creator_id: Types.ObjectId;
    room_name: string;
    status: LiveEventStatus;
    scheduled_at?: Date;
    started_at?: Date;
    ended_at?: Date;
    viewer_count: number;
    max_viewer_count: number;
    promoted_speakers: Types.ObjectId[];
    egress_id?: string;
    recording_url?: string;
    created_at: Date;
    updated_at: Date;
}

const LiveEventSchema = new Schema<ILiveEvent>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        cover_image_url: {
            type: String,
            trim: true,
        },
        creator_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        room_name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['scheduled', 'live', 'ended', 'cancelled'],
            default: 'scheduled',
            index: true,
        },
        scheduled_at: { type: Date },
        started_at: { type: Date },
        ended_at: { type: Date },
        viewer_count: { type: Number, default: 0, min: 0 },
        max_viewer_count: { type: Number, default: 0, min: 0 },
        promoted_speakers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Account',
            },
        ],
        egress_id: { type: String },
        recording_url: { type: String },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
    }
);

LiveEventSchema.index({ status: 1, scheduled_at: -1 });
LiveEventSchema.index({ creator_id: 1, created_at: -1 });

const LiveEvent: Model<ILiveEvent> =
    mongoose.models.LiveEvent || mongoose.model<ILiveEvent>('LiveEvent', LiveEventSchema);

export default LiveEvent;

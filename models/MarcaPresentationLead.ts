import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarcaPresentationLead extends Document {
    _id: mongoose.Types.ObjectId;
    person_name: string;
    brand_name: string;
    email: string;
    source: string;
    created_at: Date;
}

const MarcaPresentationLeadSchema = new Schema<IMarcaPresentationLead>(
    {
        person_name: { type: String, required: true, trim: true, maxlength: 200 },
        brand_name: { type: String, required: true, trim: true, maxlength: 200 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 320 },
        source: { type: String, default: 'lp_agendar_apresentacao', trim: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

MarcaPresentationLeadSchema.index({ created_at: -1 });
MarcaPresentationLeadSchema.index({ email: 1, created_at: -1 });

const MarcaPresentationLeadModel: Model<IMarcaPresentationLead> =
    mongoose.models.MarcaPresentationLead ??
    mongoose.model<IMarcaPresentationLead>('MarcaPresentationLead', MarcaPresentationLeadSchema);

export default MarcaPresentationLeadModel;

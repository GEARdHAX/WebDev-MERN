import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Schema.Types.ObjectId;
  referredId: mongoose.Schema.Types.ObjectId;
  status: 'pending' | 'converted';
}

const referralSchema = new Schema<IReferral>({
  referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referredId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['pending', 'converted'], default: 'pending' },
}, { timestamps: true });

const Referral = mongoose.model<IReferral>('Referral', referralSchema);
export default Referral;
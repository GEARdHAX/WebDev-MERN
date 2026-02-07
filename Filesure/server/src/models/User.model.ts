import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  referralCode: string;
  credits: number;
  referredBy: mongoose.Schema.Types.ObjectId | null;
  hasMadeFirstPurchase: boolean;
  matchPassword(enteredPass: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  referralCode: { type: String, required: true, unique: true },
  credits: { type: Number, default: 0 },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  hasMadeFirstPurchase: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPass: string) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPass, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
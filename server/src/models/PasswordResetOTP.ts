import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Password Reset OTP Schema
 * Stores OTP hashes for password reset functionality with automatic expiration
 */
export interface IPasswordResetOTP extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  attempts: number;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetOTPSchema: Schema<IPasswordResetOTP> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '5m' }, // TTL Index: Auto-delete after 5 minutes
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
PasswordResetOTPSchema.index({ email: 1, verified: 1 });

// Prevent duplicate OTPs for the same email (only one active OTP per email)
PasswordResetOTPSchema.index({ email: 1, verified: false }, { unique: true });

const PasswordResetOTP: Model<IPasswordResetOTP> = mongoose.models.PasswordResetOTP || mongoose.model<IPasswordResetOTP>('PasswordResetOTP', PasswordResetOTPSchema);

export default PasswordResetOTP;

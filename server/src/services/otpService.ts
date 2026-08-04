import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import PasswordResetOTP from '../models/PasswordResetOTP';

/**
 * OTP Service
 * Handles OTP generation, hashing, verification, and cleanup
 */
export class OTPService {
  /**
   * Generate a secure 6-digit numeric OTP
   * @returns 6-digit string
   */
  static generateOTP(): string {
    // Generate cryptographically secure random 6-digit number
    const min = 100000;
    const max = 999999;
    const range = max - min + 1;
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0) % range;
    return String(min + randomValue);
  }

  /**
   * Hash OTP using bcrypt for secure storage
   * @param otp - Plain text OTP
   * @returns Hashed OTP
   */
  static async hashOTP(otp: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(otp, saltRounds);
  }

  /**
   * Verify OTP against hash
   * @param plainOTP - Plain text OTP from user
   * @param hashedOTP - Hashed OTP from database
   * @returns boolean indicating if OTP matches
   */
  static async verifyOTP(plainOTP: string, hashedOTP: string): Promise<boolean> {
    return await bcrypt.compare(plainOTP, hashedOTP);
  }

  /**
   * Create and store new OTP for password reset
   * @param userId - User ID
   * @param email - User email
   * @returns Generated OTP (plain text for email sending)
   */
  static async createOTP(userId: string, email: string): Promise<string> {
    // Delete any existing unverified OTP for this email
    await PasswordResetOTP.deleteMany({ email, verified: false });

    // Generate new OTP
    const otp = this.generateOTP();
    const otpHash = await this.hashOTP(otp);

    // Calculate expiration (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP in database
    await PasswordResetOTP.create({
      userId,
      email,
      otpHash,
      attempts: 0,
      verified: false,
      expiresAt,
    });

    return otp;
  }

  /**
   * Validate OTP and check if it's expired or exceeded attempts
   * @param email - User email
   * @param plainOTP - Plain text OTP from user
   * @returns Object with validation result
   */
  static async validateOTP(email: string, plainOTP: string): Promise<{
    valid: boolean;
    error?: string;
    otpRecord?: any;
  }> {
    // Find OTP record
    const otpRecord = await PasswordResetOTP.findOne({
      email,
      verified: false,
    });

    if (!otpRecord) {
      return { valid: false, error: 'No valid verification code found. Please request a new code.' };
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Check maximum attempts
    if (otpRecord.attempts >= 5) {
      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });
      return { valid: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP
    const isValid = await this.verifyOTP(plainOTP, otpRecord.otpHash);

    if (!isValid) {
      const remainingAttempts = 5 - otpRecord.attempts;
      if (remainingAttempts === 0) {
        await PasswordResetOTP.deleteOne({ _id: otpRecord._id });
        return { valid: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
      }
      return { valid: false, error: `Invalid verification code. ${remainingAttempts} attempts remaining.` };
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return { valid: true, otpRecord };
  }

  /**
   * Delete OTP record after successful password reset
   * @param email - User email
   */
  static async deleteOTP(email: string): Promise<void> {
    await PasswordResetOTP.deleteOne({ email });
  }

  /**
   * Cleanup expired OTPs (called by TTL index automatically, but can be called manually)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    await PasswordResetOTP.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }
}

export default OTPService;

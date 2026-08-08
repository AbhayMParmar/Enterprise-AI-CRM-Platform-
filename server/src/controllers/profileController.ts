/**
 * Profile Controller
 * Handles all user profile, avatar, email/password management and account deletion.
 * Uses Cloudinary for avatar storage, Sharp for image optimization (via uploadMiddleware).
 */
import { Response } from 'express';
import sharp from 'sharp';
import { z } from 'zod';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import emailService from '../services/emailService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import {
  uploadAvatarToCloudinary,
  deleteAvatarFromCloudinary,
  extractPublicId,
  isCloudinaryConfigured,
} from '../services/cloudinaryService';
import { createAuditLog } from '../services/auditService';

// ─── Validation Schemas ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email('Invalid new email address'),
  password: z.string().optional(),
});

const verifyEmailChangeSchema = z.object({
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

const deleteAccountSchema = z.object({
  confirmText: z.literal('DELETE', { errorMap: () => ({ message: 'You must type DELETE to confirm' }) }),
  password: z.string().optional(),
});

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) { sendError(res, 'Not authenticated', 401); return; }

    const user = await User.findById(req.user.id);
    if (!user) { sendError(res, 'User not found', 404); return; }

    let activeSessionsCount = 1;
    try {
      activeSessionsCount = await RefreshToken.countDocuments({ userId: user._id });
    } catch {
      activeSessionsCount = 1;
    }

    sendSuccess(res, {
      user: {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone || '',
        company: user.company || '',
        jobTitle: user.jobTitle || '',
        isVerified: user.isVerified,
        googleId: user.googleId || null,
        isGoogleConnected: !!user.googleId,
        hasPassword: !!user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin || user.updatedAt,
      },
      security: {
        twoFactorEnabled: false,
        activeSessions: activeSessionsCount,
        authProvider: user.googleId ? 'Google OAuth' : 'Email/Password',
      },
    });
  } catch (error: any) {
    console.error('[profileController] getProfile:', error.message);
    sendError(res, 'Failed to retrieve profile', 500);
  }
};

// ─── PUT /api/profile ─────────────────────────────────────────────────────────

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const { name, phone, company, jobTitle } = parsed.data;
    const user = await User.findById(req.user.id);
    if (!user) { sendError(res, 'User not found', 404); return; }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;

    await user.save();

    // Fire-and-forget audit log
    createAuditLog(user.id, 'profile_updated', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Profile information updated',
    });

    sendSuccess(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone || '',
      company: user.company || '',
      jobTitle: user.jobTitle || '',
    }, 'Profile updated successfully');
  } catch (error: any) {
    console.error('[profileController] updateProfile:', error.message);
    sendError(res, 'Failed to update profile', 500);
  }
};

// ─── POST /api/profile/upload-avatar ─────────────────────────────────────────
// req.file is populated by avatarUpload Multer middleware defined in profileRoutes.ts

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    // Multer already validated format + size; req.file must exist here
    if (!req.file) {
      sendError(res, 'No image file provided. Please select a JPG, PNG, or WEBP image.', 400);
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) { sendError(res, 'User not found', 404); return; }

    // Compress and resize with Sharp (512×512 WEBP at 80% quality)
    const processedBuffer = await sharp(req.file.buffer)
      .resize(512, 512, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toBuffer();

    let avatarUrl: string;

    if (isCloudinaryConfigured()) {
      // Delete old Cloudinary avatar if it exists
      if (user.avatar && user.avatar.includes('cloudinary.com')) {
        const oldPublicId = extractPublicId(user.avatar);
        if (oldPublicId) await deleteAvatarFromCloudinary(oldPublicId);
      }

      // Upload compressed image to Cloudinary
      const { url } = await uploadAvatarToCloudinary(processedBuffer, user.id);
      avatarUrl = url;
    } else {
      // Fallback: store as data URI (works without Cloudinary, but may be large)
      const base64 = processedBuffer.toString('base64');
      avatarUrl = `data:image/webp;base64,${base64}`;
    }

    user.avatar = avatarUrl;
    await user.save();

    createAuditLog(user.id, 'avatar_upload', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Profile avatar updated',
    });

    sendSuccess(res, { avatar: user.avatar }, 'Profile picture updated successfully');
  } catch (error: any) {
    console.error('[profileController] uploadAvatar:', error.message);
    sendError(res, error.message || 'Failed to upload avatar', 500);
  }
};

// ─── DELETE /api/profile/avatar ───────────────────────────────────────────────

export const deleteAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    const user = await User.findById(req.user.id);
    if (!user) { sendError(res, 'User not found', 404); return; }

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      const publicId = extractPublicId(user.avatar);
      if (publicId) await deleteAvatarFromCloudinary(publicId);
    }

    user.avatar = '';
    await user.save();

    createAuditLog(user.id, 'avatar_delete', { ip: req.ip, details: 'Avatar removed' });

    sendSuccess(res, { avatar: '' }, 'Profile picture removed successfully');
  } catch (error: any) {
    console.error('[profileController] deleteAvatar:', error.message);
    sendError(res, 'Failed to remove avatar', 500);
  }
};

// ─── POST /api/profile/request-email-change ───────────────────────────────────

export const requestEmailChange = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    const parsed = requestEmailChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Invalid request data', 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const { newEmail, password } = parsed.data;

    const user = await User.findById(req.user.id).select('+password +emailOtp +emailOtpExpires +pendingEmail');
    if (!user) { sendError(res, 'User not found', 404); return; }

    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      sendError(res, 'New email address must be different from your current email', 400);
      return;
    }

    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) {
      sendError(res, 'An account with this email address already exists', 400);
      return;
    }

    // Verify password for password-based accounts
    if (user.password) {
      if (!password) {
        sendError(res, 'Your current password is required to change your email address', 400);
        return;
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        sendError(res, 'Incorrect password. Please try again.', 400);
        return;
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailOtp = otp;
    user.emailOtpExpires = otpExpires;
    user.pendingEmail = newEmail.toLowerCase();
    await user.save();

    emailService.sendEmailChangeOtp({ email: newEmail.toLowerCase(), name: user.name, otp });

    createAuditLog(user.id, 'email_change_requested', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Email change requested to ${newEmail}`,
    });

    sendSuccess(res, { pendingEmail: newEmail.toLowerCase() },
      `Verification code sent to ${newEmail}. It expires in 10 minutes.`
    );
  } catch (error: any) {
    console.error('[profileController] requestEmailChange:', error.message);
    sendError(res, 'Failed to send verification email', 500);
  }
};

// ─── PUT /api/profile/verify-email-change ────────────────────────────────────

export const verifyEmailChange = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    const parsed = verifyEmailChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      const msgs = parsed.error.flatten().fieldErrors.otp;
      sendError(res, msgs?.[0] || 'Please enter a valid 6-digit verification code', 400);
      return;
    }

    const { otp } = parsed.data;

    // Must explicitly select hidden OTP fields
    const user = await User.findById(req.user.id).select(
      '+emailOtp +emailOtpExpires +pendingEmail'
    );
    if (!user) { sendError(res, 'User not found', 404); return; }

    // Check that a pending request exists
    if (!user.emailOtp || !user.emailOtpExpires || !user.pendingEmail) {
      sendError(
        res,
        'No pending email change request found. Please start the process again.',
        400
      );
      return;
    }

    // Check expiry
    if (new Date() > new Date(user.emailOtpExpires)) {
      // Clear stale OTP fields
      await User.findByIdAndUpdate(user.id, {
        $unset: { emailOtp: '', emailOtpExpires: '', pendingEmail: '' },
      });
      sendError(res, 'Verification code has expired. Please request a new code.', 400);
      return;
    }

    // Compare OTP (both as trimmed strings)
    if (user.emailOtp.trim() !== otp.trim()) {
      sendError(res, 'Incorrect verification code. Please check and try again.', 400);
      return;
    }

    const newEmail = user.pendingEmail;

    // Use findByIdAndUpdate to avoid triggering pre-save password hashing
    await User.findByIdAndUpdate(user.id, {
      email: newEmail,
      $unset: { emailOtp: '', emailOtpExpires: '', pendingEmail: '' },
    });

    createAuditLog(user.id, 'email_change_verified', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Email changed to ${newEmail}`,
    });

    sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: newEmail,
        role: user.role,
        avatar: user.avatar,
      },
    }, 'Email address updated successfully!');
  } catch (error: any) {
    console.error('[profileController] verifyEmailChange:', error.message);
    sendError(res, 'Failed to verify email change', 500);
  }
};

// ─── PUT /api/profile/change-password ────────────────────────────────────────

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const { currentPassword, newPassword } = parsed.data;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) { sendError(res, 'User not found', 404); return; }

    if (!user.password) {
      sendError(res, 'Google Sign-In accounts do not have a password. Use Google to sign in.', 400);
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    user.password = newPassword;
    await user.save();

    createAuditLog(user.id, 'password_changed', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Password changed successfully',
    });

    sendSuccess(res, null, 'Password updated successfully');
  } catch (error: any) {
    console.error('[profileController] changePassword:', error.message);
    sendError(res, 'Failed to change password', 500);
  }
};

// ─── POST /api/profile/logout-all ────────────────────────────────────────────

export const logoutAllDevices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    await RefreshToken.deleteMany({ userId: req.user.id });

    createAuditLog(req.user.id, 'logout_all_devices', {
      ip: req.ip,
      details: 'Logged out from all devices',
    });

    sendSuccess(res, null, 'Successfully logged out from all active devices');
  } catch (error: any) {
    console.error('[profileController] logoutAllDevices:', error.message);
    sendError(res, 'Failed to terminate sessions', 500);
  }
};

// ─── DELETE /api/profile/account ─────────────────────────────────────────────

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { sendError(res, 'Not authenticated', 401); return; }

    const parsed = deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.flatten().fieldErrors.confirmText?.[0] || 'Type DELETE to confirm', 400);
      return;
    }

    const { password } = parsed.data;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) { sendError(res, 'User not found', 404); return; }

    // Require password verification for password-based accounts
    if (user.password) {
      if (!password) {
        sendError(res, 'Please enter your password to confirm account deletion', 400);
        return;
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        sendError(res, 'Incorrect password. Account deletion cancelled.', 400);
        return;
      }
    }

    const userId = user.id;

    // 1. Delete Cloudinary avatar if set
    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      const publicId = extractPublicId(user.avatar);
      if (publicId) await deleteAvatarFromCloudinary(publicId);
    }

    // 2. Revoke all refresh tokens / sessions
    await RefreshToken.deleteMany({ userId });

    // 3. Delete notifications
    await Notification.deleteMany({ user: userId });

    // 4. Delete activity logs
    await ActivityLog.deleteMany({ userId });

    // 5. Delete user document last
    await User.findByIdAndDelete(userId);

    sendSuccess(res, null, 'Your account has been permanently deleted. We hope to see you again.');
  } catch (error: any) {
    console.error('[profileController] deleteAccount:', error.message);
    sendError(res, 'Failed to delete account. Please try again.', 500);
  }
};

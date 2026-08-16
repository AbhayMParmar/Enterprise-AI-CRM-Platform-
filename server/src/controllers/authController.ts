import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../models/User';
import Company from '../models/Company';
import { RefreshToken } from '../models/RefreshToken';
import { TokenService } from '../services/tokenService';
import { OAuth2Client } from 'google-auth-library';
import emailService from '../services/emailService';
import { OTPService } from '../services/otpService';
import { connectDB } from '../config/db';
import SubscriptionService from '../services/subscriptionService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(8, 'Password cannot exceed 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_OWNER', 'SALES_MANAGER', 'SALES_REPRESENTATIVE', 'SuperAdmin', 'Admin', 'SalesManager', 'SalesRep']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});


// ─── Forgot Password Validation Schemas ───────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(8, 'Password cannot exceed 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const conn = await connectDB();
    if (!conn && mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again in a moment.' });
      return;
    }

    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validation.error.flatten().fieldErrors 
      });
      return;
    }

    const { name, email, password, role } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    // Only allow SUPER_ADMIN and COMPANY_OWNER for company registration flow.
    // All other new registrations (employees) start as PENDING_COMPANY — they must enter a join code.
    let userRole = role || 'SALES_REPRESENTATIVE';
    if (userRole === 'SalesRep') userRole = 'SALES_REPRESENTATIVE';
    if (userRole === 'SalesManager') userRole = 'SALES_MANAGER';
    if (userRole === 'Admin') userRole = 'COMPANY_OWNER';
    if (userRole === 'SuperAdmin') userRole = 'SUPER_ADMIN';

    const isCompanyOwnerOrSuperAdmin = userRole === 'COMPANY_OWNER' || userRole === 'SUPER_ADMIN';

    // Create user — employees start as PENDING_COMPANY (must join company via code)
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: userRole as any,
      accountStatus: isCompanyOwnerOrSuperAdmin ? 'ACTIVE' : 'PENDING_COMPANY',
      isVerified: false,
    });

    const userId = newUser.id || (newUser._id as any).toString();

    // Generate tokens
    const accessToken = TokenService.generateAccessToken({ id: userId, role: userRole });
    const refreshToken = await TokenService.generateRefreshToken(userId);

    // Set cookie
    TokenService.setRefreshTokenCookie(res, refreshToken);

    const subStatus = SubscriptionService.getSubscriptionStatus(newUser);

    res.status(201).json({
      success: true,
      message: isCompanyOwnerOrSuperAdmin
        ? 'Registration successful'
        : 'Account created. Please enter your company join code to continue.',
      accessToken,
      requiresJoinCode: !isCompanyOwnerOrSuperAdmin,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: userRole,
        avatar: newUser.avatar || '',
        accountStatus: newUser.accountStatus,
        subscription: subStatus,
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Registration error:', error);

    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message, errors: error.errors });
      return;
    }
    if (error.message?.includes('RefreshToken') || error.message?.includes('MongoDB')) {
      res.status(500).json({ success: false, message: 'Session creation failed. Please try again.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Registration failed due to server error. Please try again.' });
  }
};


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const conn = await connectDB();
    if (!conn && mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again in a moment.' });
      return;
    }

    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validation.error.flatten().fieldErrors 
      });
      return;
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Invalid email or password' });
        return;
      }
    }

    const userId = user.id || (user._id as any).toString();
    let normalizedRole = user.role || 'SALES_REPRESENTATIVE';
    if (normalizedRole === 'SuperAdmin') normalizedRole = 'SUPER_ADMIN';
    if (normalizedRole === 'Admin') normalizedRole = 'COMPANY_OWNER';
    if (normalizedRole === 'SalesManager') normalizedRole = 'SALES_MANAGER';
    if (normalizedRole === 'SalesRep') normalizedRole = 'SALES_REPRESENTATIVE';

    // Update lastLogin timestamp asynchronously
    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(() => {});

    // SuperAdmin Bypass — unaffected by join code system
    if (normalizedRole === 'SUPER_ADMIN') {
      const accessToken = TokenService.generateAccessToken({ id: userId, role: 'SUPER_ADMIN' });
      const refreshToken = await TokenService.generateRefreshToken(userId);
      TokenService.setRefreshTokenCookie(res, refreshToken);

      const subStatus = SubscriptionService.getSubscriptionStatus(user);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken,
        user: {
          id: userId,
          name: user.name || normalizedEmail.split('@')[0],
          email: user.email || normalizedEmail,
          role: 'SUPER_ADMIN',
          avatar: user.avatar || '',
          accountStatus: 'ACTIVE',
          subscription: subStatus,
        },
      });
      return;
    }

    // ── User State Machine ────────────────────────────────────────────────────

    // REJECTED — block login
    if (user.accountStatus === 'REJECTED') {
      res.status(403).json({
        success: false,
        message: 'Your join request was rejected by the company admin. Please contact them for access.',
        accountStatus: 'REJECTED',
      });
      return;
    }

    // PENDING_COMPANY — user registered but hasn't entered a join code
    if (user.accountStatus === 'PENDING_COMPANY') {
      const accessToken = TokenService.generateAccessToken({ id: userId, role: normalizedRole });
      const refreshToken = await TokenService.generateRefreshToken(userId);
      TokenService.setRefreshTokenCookie(res, refreshToken);
      res.status(200).json({
        success: true,
        message: 'Please enter your company join code to continue.',
        accessToken,
        requiresJoinCode: true,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: normalizedRole,
          avatar: user.avatar || '',
          accountStatus: 'PENDING_COMPANY',
        },
      });
      return;
    }

    // PENDING_APPROVAL — user submitted join code, waiting for admin
    if (user.accountStatus === 'PENDING_APPROVAL') {
      const accessToken = TokenService.generateAccessToken({ id: userId, role: normalizedRole });
      const refreshToken = await TokenService.generateRefreshToken(userId);
      TokenService.setRefreshTokenCookie(res, refreshToken);
      res.status(200).json({
        success: true,
        message: 'Your join request is awaiting approval from the Company Admin.',
        accessToken,
        requiresPendingApproval: true,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: normalizedRole,
          avatar: user.avatar || '',
          accountStatus: 'PENDING_APPROVAL',
        },
      });
      return;
    }

    // Determine company memberships
    let companyMemberships: Array<{ id: string; companyName: string; role: string; status: string }> = [];

    // Check direct companyId
    if (user.companyId) {
      const mainComp = await Company.findById(user.companyId);
      if (mainComp) {
        companyMemberships.push({
          id: mainComp.id,
          companyName: mainComp.companyName,
          role: normalizedRole,
          status: mainComp.status,
        });
      }
    }

    // Check companies array for multi-membership
    if (user.companies && user.companies.length > 0) {
      for (const mem of user.companies) {
        if (!companyMemberships.some((c) => c.id === mem.companyId.toString())) {
          const comp = await Company.findById(mem.companyId);
          if (comp) {
            companyMemberships.push({
              id: comp.id,
              companyName: comp.companyName,
              role: mem.role || normalizedRole,
              status: comp.status,
            });
          }
        }
      }
    }

    // Check if user is owner of any company
    const ownedCompanies = await Company.find({ ownerId: user._id });
    for (const comp of ownedCompanies) {
      if (!companyMemberships.some((c) => c.id === comp.id)) {
        companyMemberships.push({
          id: comp.id,
          companyName: comp.companyName,
          role: 'COMPANY_OWNER',
          status: comp.status,
        });
      }
    }

    // CASE 3: User has NO company
    if (companyMemberships.length === 0) {
      res.status(200).json({
        success: true,
        noCompany: true,
        message: 'No company is associated with your account.',
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: normalizedRole,
        },
      });
      return;
    }

    // CASE 2: User belongs to MULTIPLE companies
    if (companyMemberships.length > 1) {
      const tempToken = TokenService.generateAccessToken({ id: userId, role: normalizedRole });
      res.status(200).json({
        success: true,
        requiresCompanySelection: true,
        message: 'Please select a company to continue.',
        accessToken: tempToken,
        companies: companyMemberships,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: normalizedRole,
        },
      });
      return;
    }

    // CASE 1: User belongs to ONE company
    const singleComp = companyMemberships[0];

    const accessToken = TokenService.generateAccessToken({
      id: userId,
      role: singleComp.role as any,
      companyId: singleComp.id,
    });
    const refreshToken = await TokenService.generateRefreshToken(userId);
    TokenService.setRefreshTokenCookie(res, refreshToken);

    const subStatus = SubscriptionService.getSubscriptionStatus(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: userId,
        name: user.name || normalizedEmail.split('@')[0],
        email: user.email || normalizedEmail,
        role: singleComp.role,
        avatar: user.avatar || '',
        companyId: singleComp.id,
        companyName: singleComp.companyName,
        companyStatus: singleComp.status,
        accountStatus: user.accountStatus,
        subscription: subStatus,
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Login error:', error?.message || error);
    if (error.message?.includes('RefreshToken') || error.message?.includes('MongoDB')) {
      res.status(500).json({ success: false, message: 'Session creation failed. Please try again.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Login failed due to server error. Please try again.' });
  }
};

// -----------------------------------------------------------------------------
// POST /api/auth/select-company — Select active company context for multi-company users
// -----------------------------------------------------------------------------
export const selectCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { companyId } = req.body;
    if (!companyId) {
      res.status(400).json({ message: 'Company ID is required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      res.status(404).json({ message: 'Selected company not found' });
      return;
    }

    // Verify membership or ownership
    const isOwner = company.ownerId.toString() === user._id.toString();
    const isMember = user.companyId?.toString() === companyId || user.companies?.some((c) => c.companyId.toString() === companyId);

    if (!isOwner && !isMember && user.role !== 'SUPER_ADMIN' && user.role !== 'SuperAdmin') {
      res.status(403).json({ message: 'You are not a member of this company' });
      return;
    }

    let activeRole = user.role;
    if (isOwner) activeRole = 'COMPANY_OWNER';

    // Set user's active companyId
    user.companyId = company._id as any;
    await user.save();

    const accessToken = TokenService.generateAccessToken({
      id: user.id,
      role: activeRole,
      companyId: company.id,
    });

    const subStatus = SubscriptionService.getSubscriptionStatus(user);

    res.status(200).json({
      success: true,
      message: `Active company switched to ${company.companyName}`,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: activeRole,
        avatar: user.avatar || '',
        companyId: company.id,
        companyName: company.companyName,
        companyStatus: company.status,
        subscription: subStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to select company context', error: error.message });
  }
};


export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      await RefreshToken.findOneAndDelete({ token: refreshToken }).catch(() => {});
    }

    TokenService.clearRefreshTokenCookie(res);
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error: any) {
    console.error('[AUTH] Logout error:', error?.message || error);
    TokenService.clearRefreshTokenCookie(res);
    res.status(200).json({ success: true, message: 'Logout completed' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthRefresh] Cookie exists:', !!token);
    }

    if (!token) {
      res.status(200).json({
        success: false,
        authenticated: false,
        message: 'No active session',
      });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthRefresh] Refresh token verification started');
    }

    // Verify cryptographic signature of the Refresh JWT
    const decoded = TokenService.verifyRefreshToken(token);

    if (!decoded || (!decoded.userId && !decoded.id)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthRefresh] Refresh token verification failed or expired');
      }
      TokenService.clearRefreshTokenCookie(res);
      res.status(200).json({
        success: false,
        authenticated: false,
        message: 'Session invalid or expired',
      });
      return;
    }

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthRefresh] User found:', !!user);
    }

    if (!user) {
      TokenService.clearRefreshTokenCookie(res);
      res.status(200).json({
        success: false,
        authenticated: false,
        message: 'User account no longer exists',
      });
      return;
    }

    // Check account status
    if (user.accountStatus === 'REJECTED' || user.accountStatus === 'SUSPENDED') {
      TokenService.clearRefreshTokenCookie(res);
      res.status(200).json({
        success: false,
        authenticated: false,
        message: 'Your account access has been suspended or rejected.',
        accountStatus: user.accountStatus,
      });
      return;
    }

    let normalizedRole = user.role || 'SALES_REPRESENTATIVE';
    if (normalizedRole === 'SuperAdmin') normalizedRole = 'SUPER_ADMIN';
    if (normalizedRole === 'Admin') normalizedRole = 'COMPANY_OWNER';
    if (normalizedRole === 'SalesManager') normalizedRole = 'SALES_MANAGER';
    if (normalizedRole === 'SalesRep') normalizedRole = 'SALES_REPRESENTATIVE';

    const userIdStr = user.id || (user._id as any).toString();
    const activeCompanyId = user.companyId?.toString();

    let companyName = '';
    let companyStatus = 'ACTIVE';
    if (activeCompanyId) {
      const comp = await Company.findById(activeCompanyId);
      if (comp) {
        companyName = comp.companyName;
        companyStatus = comp.status;
      }
    }

    // Generate new Access Token and fresh Refresh Token
    const newAccessToken = TokenService.generateAccessToken({
      id: userIdStr,
      role: normalizedRole as any,
      companyId: activeCompanyId,
    });

    const newRefreshToken = await TokenService.generateRefreshToken(userIdStr);
    TokenService.setRefreshTokenCookie(res, newRefreshToken);

    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthRefresh] Access token generated');
    }

    const subStatus = SubscriptionService.getSubscriptionStatus(user);
    const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: userIdStr,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        avatar: user.avatar || '',
        companyId: activeCompanyId,
        companyName,
        companyStatus,
        accountStatus: isSuperAdmin ? 'ACTIVE' : (user.accountStatus || 'ACTIVE'),
        subscription: subStatus,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AuthRefresh] Token refresh error:', error?.message || error);
    }
    res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const conn = await connectDB();
    if (!conn && mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again in a moment.' });
      return;
    }
    const { credential, accessToken } = req.body;
    if (!credential && !accessToken) {
      res.status(400).json({ 
        success: false,
        message: 'Google credential (idToken) or accessToken is required' 
      });
      return;
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(500).json({ 
        success: false,
        message: 'Google OAuth not configured on server' 
      });
      return;
    }

    // Normalized Google user info from either verification flow
    interface GoogleUserInfo {
      email: string;
      name?: string;
      picture?: string;
      sub?: string;
    }

    let googleUser: GoogleUserInfo | null = null;

    if (credential) {
      // ── ID Token flow (GoogleLogin component / One Tap) ──────────────────────
      let idTokenPayload: { email?: string | null; name?: string; picture?: string; sub?: string } | undefined;
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const p = ticket.getPayload();
        if (p) {
          idTokenPayload = {
            email: p.email,
            name: p.name,
            picture: p.picture,
            sub: p.sub,
          };
        }
      } catch (verifyErr: any) {
        // Only allow mock tokens in development mode for testing
        if (process.env.NODE_ENV === 'development' && credential.startsWith('mock-google-token-')) {
          const mockEmail = credential.replace('mock-google-token-', '') + '@gmail.com';
          idTokenPayload = {
            email: mockEmail,
            name: credential.replace('mock-google-token-', ''),
            picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
            sub: 'google-sub-id-' + credential,
          };
        } else {
          res.status(400).json({ 
            success: false,
            message: 'Failed to verify Google ID token', 
            error: process.env.NODE_ENV === 'development' ? verifyErr.message : undefined 
          });
          return;
        }
      }

      if (!idTokenPayload || !idTokenPayload.email) {
        res.status(400).json({ message: 'Invalid payload from Google verification' });
        return;
      }

      googleUser = {
        email: idTokenPayload.email,
        name: idTokenPayload.name,
        picture: idTokenPayload.picture,
        sub: idTokenPayload.sub,
      };

    } else if (accessToken) {
      // ── Access Token flow (useGoogleLogin implicit) ──────────────────────────
      // Fetch user profile from Google's userinfo endpoint using the OAuth access token
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userInfoRes.ok) {
        res.status(400).json({ 
          success: false,
          message: 'Failed to fetch Google user info. Invalid or expired access token.' 
        });
        return;
      }

      const rawInfo = await userInfoRes.json() as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
      };

      if (!rawInfo.email) {
        res.status(400).json({ message: 'Could not retrieve email from Google account' });
        return;
      }

      googleUser = {
        email: rawInfo.email,
        name: rawInfo.name,
        picture: rawInfo.picture,
        sub: rawInfo.sub,
      };
    }

    if (!googleUser) {
      res.status(400).json({ 
        success: false,
        message: 'Could not extract user info from Google response' 
      });
      return;
    }

    const { email, name, picture, sub: googleId } = googleUser;

    // Check if user exists by email
    let user = await User.findOne({ email });

    if (!user) {
      // New Google user — create as PENDING_COMPANY (must enter join code)
      user = await User.create({
        name: name || 'Google User',
        email,
        avatar: picture || '',
        googleId,
        isVerified: true, // Google email is pre-verified
        role: 'SALES_REPRESENTATIVE', // Default role — set permanently on approval
        accountStatus: 'PENDING_COMPANY',
      });
    } else if (!user.googleId) {
      // Link googleId to existing account
      user.googleId = googleId;
      await user.save();
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // ── User State Machine ────────────────────────────────────────────────────

    // REJECTED — block login
    if (user.accountStatus === 'REJECTED') {
      res.status(403).json({
        success: false,
        message: 'Your join request was rejected. Please contact the company admin.',
        accountStatus: 'REJECTED',
      });
      return;
    }

    // Generate tokens for all states
    const jwtAccessToken = TokenService.generateAccessToken({ id: user.id, role: user.role, companyId: user.companyId?.toString() });
    const refreshToken = await TokenService.generateRefreshToken(user.id);
    TokenService.setRefreshTokenCookie(res, refreshToken);

    const subStatus = SubscriptionService.getSubscriptionStatus(user);

    // PENDING_COMPANY — no join code submitted yet
    if (user.accountStatus === 'PENDING_COMPANY' || (!user.companyId && user.accountStatus !== 'ACTIVE')) {
      res.status(200).json({
        success: true,
        message: 'Please enter your company join code to continue.',
        accessToken: jwtAccessToken,
        requiresJoinCode: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          accountStatus: 'PENDING_COMPANY',
          subscription: subStatus,
        },
      });
      return;
    }

    // PENDING_APPROVAL — join code submitted, awaiting admin
    if (user.accountStatus === 'PENDING_APPROVAL') {
      res.status(200).json({
        success: true,
        message: 'Your join request is awaiting approval from the Company Admin.',
        accessToken: jwtAccessToken,
        requiresPendingApproval: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          accountStatus: 'PENDING_APPROVAL',
          subscription: subStatus,
        },
      });
      return;
    }

    // ACTIVE user with companyId — normal login
    let companyName = '';
    let companyStatus = 'ACTIVE';
    if (user.companyId) {
      const comp = await Company.findById(user.companyId);
      if (comp) {
        companyName = comp.companyName;
        companyStatus = comp.status;
      }
    }

    // Return response immediately to prevent Vercel 504 gateway timeout
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      accessToken: jwtAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        companyId: user.companyId?.toString(),
        companyName,
        companyStatus,
        accountStatus: user.accountStatus,
        subscription: subStatus,
      },
    });

    // Asynchronously dispatch Google Login Security Notification Email in background (non-blocking)
    const clientIp = (req.headers['x-forwarded-for'] as string || req.ip || '127.0.0.1').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    setImmediate(() => {
      emailService.sendGoogleLoginSecurityNotification({
        email: user.email,
        name: user.name,
        ipAddress: clientIp,
        userAgent,
        dateTime: new Date().toUTCString(),
      }).catch((err) => console.warn('[Background Email Notification Ignored]:', err?.message));
    });
  } catch (error: any) {
    console.error('[AUTH] Google login error:', error?.message || error);
    // If refresh token creation failed, don't set cookie or return success
    if (error.message?.includes('RefreshToken') || error.message?.includes('MongoDB')) {
      res.status(500).json({ success: false, message: 'Session creation failed. Please try again.' });
      return;
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error during Google login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD FLOW — OTP is ONLY used here
// ─────────────────────────────────────────────────────────────

/**
 * Step 1: Forgot Password — Send OTP to user's email
 * POST /api/auth/forgot-password
 *
 * - Normalizes email
 * - Sends OTP if user exists (generic response to prevent email enumeration)
 * - Enforces 60-second resend cooldown on backend
 * - OTP expires in 2 minutes
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validation.error.flatten().fieldErrors 
      });
      return;
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response for security — don't reveal if email exists
    if (!user) {
      res.status(200).json({ 
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.',
        expiresIn: 120,
      });
      return;
    }

    // Generate and store OTP (60s resend cooldown is enforced inside createOTP)
    let otp: string;
    try {
      otp = await OTPService.createOTP(user._id.toString(), normalizedEmail);
    } catch (cooldownError: any) {
      // Resend cooldown active — return the specific error message
      res.status(429).json({
        success: false,
        message: cooldownError.message || 'Please wait before requesting a new code.',
      });
      return;
    }

    // Send email with OTP
    try {
      await emailService.sendForgotPasswordOtp({
        email: normalizedEmail,
        name: user.name,
        otp,
      });
    } catch (emailError: any) {
      // Email failed — clean up the OTP record so user can retry
      await OTPService.deleteOTP(normalizedEmail);
      res.status(500).json({ 
        success: false,
        message: 'Failed to send verification code. Please try again later.' 
      });
      return;
    }

    // Build response
    const response: any = {
      success: true,
      message: 'Verification code sent successfully.',
      expiresIn: 120, // seconds
    };

    // Expose plain OTP only in development for easier testing
    if (process.env.NODE_ENV === 'development') {
      response.devModeCode = otp;
    }

    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'An unexpected error occurred. Please try again later.' 
    });
  }
};

/**
 * Step 2: Verify OTP
 * POST /api/auth/verify-reset-otp
 *
 * - Validates the 6-digit OTP against the stored hash
 * - Deletes OTP immediately after successful verification (single-use)
 * - Issues a short-lived password-reset token (NOT a login token)
 * - The reset token has purpose = "password-reset" and cannot provide CRM access
 */
export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = verifyOTPSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validation.error.flatten().fieldErrors 
      });
      return;
    }

    const { email, otp } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Validate OTP — on success the record is deleted immediately
    const result = await OTPService.validateOTP(normalizedEmail, otp);

    if (!result.valid) {
      res.status(400).json({ 
        success: false,
        message: result.error 
      });
      return;
    }

    // OTP is valid and deleted — issue a short-lived password-reset authorization token
    // This token is NOT a login token. It cannot access any protected routes.
    // It can ONLY be used at the /reset-password endpoint.
    const resetToken = OTPService.generatePasswordResetToken(normalizedEmail);

    res.status(200).json({ 
      success: true,
      message: 'OTP verified successfully.',
      resetToken, // Short-lived JWT for password reset only
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'Verification process encountered an error.' 
    });
  }
};

/**
 * Step 3: Reset Password
 * POST /api/auth/reset-password
 *
 * - Verifies the short-lived password-reset token (issued after OTP verification)
 * - Confirms token purpose = "password-reset" (cannot be a normal access token)
 * - Validates the new password against the same rules as registration
 * - Updates the user's password using existing bcrypt hashing (pre-save hook)
 * - Returns success — user must log in with their new password
 *
 * NOTE: This endpoint does NOT re-verify the OTP. The OTP was already
 * verified in /verify-reset-otp and deleted on success. The resetToken
 * proves that OTP verification succeeded.
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validation.error.flatten().fieldErrors 
      });
      return;
    }

    const { email, resetToken, newPassword } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify the password-reset token (checks signature, expiry, and purpose claim)
    const tokenEmail = OTPService.verifyPasswordResetToken(resetToken);

    if (!tokenEmail) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset authorization. Please restart the forgot password process.',
      });
      return;
    }

    // Ensure the token was issued for the same email being used
    if (tokenEmail.toLowerCase() !== normalizedEmail) {
      res.status(400).json({
        success: false,
        message: 'Reset authorization does not match the provided email address.',
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
      return;
    }

    // Set new password — the pre-save hook in User model will hash it using bcrypt
    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Password updated successfully. You can now sign in with your new password.' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'Password reset failed. Please try again.' 
    });
  }
};

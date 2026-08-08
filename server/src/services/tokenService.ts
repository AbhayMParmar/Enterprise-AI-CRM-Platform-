import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { RefreshToken } from '../models/RefreshToken';
import { Types } from 'mongoose';

export interface TokenPayload {
  id: string;
  role: string;
}

export class TokenService {
  // Generate Access Token (JWT)
  static generateAccessToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      console.warn('[AUTH] JWT_SECRET not set, using fallback for development only');
    }
    const finalSecret = secret || 'fallback_access_secret_123';
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '15m';
    
    return jwt.sign(payload, finalSecret, { expiresIn: expiresIn as any });
  }

  // Generate Refresh Token database record
  static async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    // Safely parse expiry: '7d' → 7, '7' → 7, '' → 7
    const rawExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7';
    const expiryDays = Math.max(1, parseInt(rawExpiry.replace(/[^0-9]/g, ''), 10) || 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // MUST successfully store in MongoDB before returning token
    await RefreshToken.create({
      userId: new Types.ObjectId(userId),
      token,
      expiresAt,
    });

    return token;
  }

  // Set HTTP-only secure cookie
  static setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const rawExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7';
    const expiryDays = Math.max(1, parseInt(rawExpiry.replace(/[^0-9]/g, ''), 10) || 7);
    
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: expiryDays * 24 * 60 * 60 * 1000, // guaranteed integer ms
      path: '/',  // Use root path so cookie is sent to ALL /api/* routes, not just /api/auth
    });
  }

  // Clear HTTP-only secure cookie
  static clearRefreshTokenCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/', // Must match the path used when setting the cookie
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): TokenPayload | null {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      console.warn('[AUTH] JWT_SECRET not set, using fallback for development only');
    }
    const finalSecret = secret || 'fallback_access_secret_123';
    try {
      return jwt.verify(token, finalSecret) as TokenPayload;
    } catch {
      return null;
    }
  }
}

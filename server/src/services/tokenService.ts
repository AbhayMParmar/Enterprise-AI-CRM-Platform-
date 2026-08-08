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
    const secret = process.env.JWT_SECRET || 'fallback_access_secret_123';
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '15m';
    
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  // Generate Refresh Token database record
  static async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '7', 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    try {
      await RefreshToken.create({
        userId: new Types.ObjectId(userId),
        token,
        expiresAt,
      });
    } catch (err) {
      console.warn('RefreshToken creation warning (non-fatal):', err);
    }

    return token;
  }

  // Set HTTP-only secure cookie
  static setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const expiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '7', 10) || 7;
    
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProduction, // Set to true in production
      sameSite: isProduction ? 'none' : 'lax', // cross-site cookies in prod (if hosted on separate domains)
      maxAge: expiryDays * 24 * 60 * 60 * 1000, // in milliseconds
      path: '/api/auth', // only sent to authentication paths
    });
  }

  // Clear HTTP-only secure cookie
  static clearRefreshTokenCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/auth',
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): TokenPayload | null {
    const secret = process.env.JWT_SECRET || 'fallback_access_secret_123';
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch {
      return null;
    }
  }
}

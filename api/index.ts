import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../server/src/config/db';
import app from '../server/src/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — wraps the Express app.
 *
 * Singleton DB connection pattern:
 *   Vercel keeps warm Lambda instances alive between requests.
 *   We track connection state so we only call connectDB() once per
 *   container lifetime instead of on every single request.
 */
let isConnected = false;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Establish MongoDB connection on the first request (cold start)
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('[Vercel] MongoDB connection failed:', err);
      // Don't crash the function — let Express handle the error with a 503
    }
  }

  // Delegate request handling to the Express app
  return new Promise((resolve, reject) => {
    // Express's `app` is a standard Node.js (req, res) handler — Vercel is compatible
    (app as any)(req, res, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

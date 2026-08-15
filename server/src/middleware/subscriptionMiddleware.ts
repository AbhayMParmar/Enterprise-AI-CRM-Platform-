import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import Company from '../models/Company';

/**
 * Enhanced AI Feature Entitlement & Credit Guard Middleware
 * Enables AI features for ALL authenticated user roles (SuperAdmin, Admin, SalesManager, SalesRep, User)
 */
export const requireAIFeatureAccess = (featureKey?: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // All authenticated roles (SuperAdmin, Admin, SalesManager, SalesRep, User) have AI access enabled by default
      const activeCompanyId = req.companyId || req.user.companyId;
      if (activeCompanyId) {
        const company = await Company.findById(activeCompanyId);
        if (company) {
          // Only restrict if company workspace is explicitly SUSPENDED or REJECTED by SuperAdmin
          if (company.status === 'SUSPENDED' || company.status === 'REJECTED') {
            res.status(403).json({
              success: false,
              message: `Company workspace is currently ${company.status.toLowerCase()}. AI features are restricted.`,
              code: 'COMPANY_INACTIVE',
            });
            return;
          }

          // Increment usage count in background for usage tracking
          Company.findByIdAndUpdate(activeCompanyId, {
            $inc: { 'subscription.currentAiUsage': 1 },
          }).catch(() => {});
        }
      }

      // Allow access for all authenticated users
      next();
    } catch (error: any) {
      console.error('[SUBSCRIPTION MIDDLEWARE] Error verifying AI access:', error);
      // Fallback: allow request so AI service is not blocked
      next();
    }
  };
};

export default requireAIFeatureAccess;

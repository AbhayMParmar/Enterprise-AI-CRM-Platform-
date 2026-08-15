import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import Company from '../models/Company';
import Package from '../models/Package';

/**
 * Enhanced AI Feature Entitlement & Credit Guard Middleware
 * 1. Authenticates user & checks role (SuperAdmin bypass)
 * 2. Identifies active company & active subscription
 * 3. Validates subscription expiry status
 * 4. Validates package AI feature enablement (e.g. emailGenerator, meetingSummary, copilotChat)
 * 5. Validates & increments AI query limit credits
 */
export const requireAIFeatureAccess = (featureKey?: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // SuperAdmin bypass
      if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'SuperAdmin') {
        next();
        return;
      }

      const activeCompanyId = req.companyId || req.user.companyId;
      if (!activeCompanyId) {
        // Individual or newly registered user without linked company ID — allow trial AI access
        next();
        return;
      }

      const company = await Company.findById(activeCompanyId);
      if (!company) {
        // Company record not found — allow trial access
        next();
        return;
      }

      // Check company status: Only restrict if company is explicitly SUSPENDED or REJECTED
      if (company.status === 'SUSPENDED' || company.status === 'REJECTED') {
        res.status(403).json({
          success: false,
          message: `Company workspace is currently ${company.status.toLowerCase()}. AI features are restricted.`,
          code: 'COMPANY_INACTIVE',
        });
        return;
      }

      const sub = (company.subscription || {}) as any;
      const now = new Date();

      // Subscription Expiry Check
      let isExpired = false;
      if (sub.status === 'expired' || sub.status === 'suspended' || sub.status === 'cancelled') {
        isExpired = true;
      } else if (sub.status === 'trial' && sub.trialEndDate && now > new Date(sub.trialEndDate)) {
        isExpired = true;
      } else if (sub.status === 'active' && sub.endDate && now > new Date(sub.endDate)) {
        isExpired = true;
      }

      if (isExpired) {
        company.subscription.status = 'expired';
        await company.save();

        res.status(403).json({
          success: false,
          message: 'Your company trial or subscription has expired. Please upgrade your plan to continue using AI features.',
          code: 'SUBSCRIPTION_EXPIRED',
          subscription: {
            plan: sub.plan || 'trial',
            status: 'expired',
            aiAccess: false,
          },
        });
        return;
      }

      // Load Package details for feature & credit enforcement
      let pkg = null;
      if (sub.packageId) {
        pkg = await Package.findById(sub.packageId);
      } else if (sub.plan) {
        pkg = await Package.findOne({ slug: sub.plan });
      }

      // Feature Toggle Check
      if (featureKey && pkg && pkg.aiFeatures) {
        const featureEnabled = (pkg.aiFeatures as any)[featureKey];
        if (featureEnabled === false) {
          res.status(403).json({
            success: false,
            message: `The '${featureKey}' AI feature is disabled in your company's '${pkg.name}' plan. Please upgrade to access this feature.`,
            code: 'FEATURE_NOT_INCLUDED',
            feature: featureKey,
            plan: pkg.name,
          });
          return;
        }
      }

      // AI Credit Limit Check
      const aiQueryLimit = pkg?.limits?.aiQueryLimit || sub.usageLimits?.aiQueryLimit || 1000;
      const currentUsage = sub.currentAiUsage || 0;

      if (currentUsage >= aiQueryLimit) {
        res.status(403).json({
          success: false,
          message: `Monthly AI credit quota reached (${currentUsage}/${aiQueryLimit} queries used). Upgrade your package for higher limits.`,
          code: 'AI_QUOTA_EXCEEDED',
          usage: currentUsage,
          limit: aiQueryLimit,
        });
        return;
      }

      // Increment usage count atomically
      await Company.findByIdAndUpdate(activeCompanyId, {
        $inc: { 'subscription.currentAiUsage': 1 },
      });

      next();
    } catch (error: any) {
      console.error('[SUBSCRIPTION MIDDLEWARE] Error enforcing AI entitlement:', error);
      res.status(500).json({ success: false, message: 'Failed to verify AI subscription entitlement' });
    }
  };
};

export default requireAIFeatureAccess;

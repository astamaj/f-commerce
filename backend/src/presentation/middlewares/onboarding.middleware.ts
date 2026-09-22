import { Request, Response, NextFunction } from 'express';
import { BusinessModel } from '../../infrastructure/database/mongoose/models/Business.js';
import { getTenantId } from '../../infrastructure/database/mongoose/context.js';

export async function onboardingGate(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/onboarding') || req.path === '/api/business/onboarding') {
    next();
    return;
  }

  if (req.path.startsWith('/api/auth/') || req.path === '/health') {
    next();
    return;
  }

  const businessId = getTenantId();
  if (!businessId) {
    next();
    return;
  }

  try {
    const business = await BusinessModel.findById(businessId).select('onboardingComplete').lean();
    if (!business || !business.onboardingComplete) {
      if (req.path.startsWith('/api/')) {
        res.status(403).json({
          error: 'Onboarding required',
          message: 'Please complete your business profile before accessing this resource',
        });
        return;
      }
      res.redirect(302, '/onboarding');
      return;
    }
    next();
  } catch {
    next();
  }
}

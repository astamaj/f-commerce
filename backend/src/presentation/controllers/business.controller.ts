import { Request, Response, Router } from 'express';
import multer from 'multer';
import { BusinessService } from '../../application/services/business.service.js';
import { requireAuth, requireBusinessRole } from '../middlewares/auth.middleware.js';
import { MongooseBusinessRepository } from '../../infrastructure/database/mongoose/repositories/business.repository.js';
import { CloudinaryService } from '../../infrastructure/services/cloudinary.service.js';
import {
  BusinessProfileSchema,
  BusinessProfileUpdateSchema,
  DraftSaveSchema,
} from '@f-commerce/contracts';
import { NotFoundError } from '../../domain/errors.js';
import { BusinessModel } from '../../infrastructure/database/mongoose/models/Business.js';
import { runWithContext } from '../../infrastructure/database/mongoose/context.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const businessRouter = Router();

const businessRepository = new MongooseBusinessRepository();
const cloudinaryService = new CloudinaryService();
const businessService = new BusinessService(businessRepository, cloudinaryService);

businessRouter.use(requireAuth);

// Onboarding gate: block access for incomplete businesses, except onboarding routes
businessRouter.use((req, res, next) => {
  // Exempt onboarding completion, draft, and logo upload endpoints
  if (req.path === '/onboarding' || req.path.startsWith('/onboarding/') || req.path === '/logo') {
    next();
    return;
  }

  const memberships = (req.user as { memberships?: { businessId: string }[] })?.memberships;
  const membership = memberships?.[0];
  if (!membership) {
    res.status(400).json({ error: 'No business context', message: 'Missing business context' });
    return;
  }

  // Run the DB lookup inside the tenant context so the query is isolated
  runWithContext(
    { userId: (req.user as { userId: string }).userId, businessId: membership.businessId },
    async () => {
      try {
        const business = await BusinessModel.findById(membership.businessId)
          .select('onboardingComplete')
          .lean();
        if (!business || !business.onboardingComplete) {
          res.status(403).json({
            error: 'Onboarding required',
            message: 'Please complete your business profile before accessing this resource',
          });
          return;
        }
        next();
      } catch {
        res
          .status(500)
          .json({ error: 'Internal server error', message: 'Failed to verify onboarding status' });
      }
    },
  );
});

businessRouter.get(
  '/me',
  requireBusinessRole(['OWNER', 'STAFF']),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req.user as { memberships: { businessId: string }[] }).memberships[0]
        ?.businessId;
      if (!businessId) {
        res.status(400).json({ error: 'No business context', message: 'Missing business context' });
        return;
      }

      const business = await businessService.getBusiness(businessId);
      if (!business) {
        res.status(404).json({ error: 'Business not found', message: 'Business not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          name: business.name,
          currency: business.currency,
          logoUrl: business.logoUrl ?? null,
          address: business.address ?? null,
          onboardingComplete: business.onboardingComplete,
          onboardingDraft: business.onboardingDraft,
        },
        message: 'Business profile retrieved',
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
);

businessRouter.put('/me', requireBusinessRole(['OWNER']), async (req: Request, res: Response) => {
  try {
    const parsed = BusinessProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const businessId = (req.user as { memberships: { businessId: string }[] }).memberships[0]
      ?.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'No business context', message: 'Missing business context' });
      return;
    }

    const business = await businessService.updateBusiness(businessId, parsed.data);
    if (!business) {
      res.status(404).json({ error: 'Business not found', message: 'Business not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        name: business.name,
        currency: business.currency,
        logoUrl: business.logoUrl ?? null,
        address: business.address ?? null,
        onboardingComplete: business.onboardingComplete,
      },
      message: 'Business profile updated',
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

businessRouter.post(
  '/logo',
  requireBusinessRole(['OWNER']),
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded', message: 'Please upload an image file' });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res
          .status(400)
          .json({
            error: 'Invalid file type',
            message: 'Only JPEG, PNG, GIF, and WebP images are allowed',
          });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        res.status(400).json({ error: 'File too large', message: 'Maximum file size is 5MB' });
        return;
      }

      const businessId = (req.user as { memberships: { businessId: string }[] }).memberships[0]
        ?.businessId;
      if (!businessId) {
        res.status(400).json({ error: 'No business context', message: 'Missing business context' });
        return;
      }

      const result = await businessService.uploadLogo(businessId, req.file.buffer);
      res.status(200).json({
        success: true,
        data: { logoUrl: result.logoUrl },
        message: 'Logo uploaded successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(502).json({ error: 'Cloudinary upload failed', message });
    }
  },
);

businessRouter.put(
  '/onboarding',
  requireBusinessRole(['OWNER']),
  async (req: Request, res: Response) => {
    try {
      const parsed = BusinessProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
        return;
      }

      const businessId = (req.user as { memberships: { businessId: string }[] }).memberships[0]
        ?.businessId;
      if (!businessId) {
        res.status(400).json({ error: 'No business context', message: 'Missing business context' });
        return;
      }

      const { name, currency, address, logoUrl } = parsed.data;
      const business = await businessService.completeOnboarding(businessId, {
        name,
        currency,
        address,
        logoUrl,
      });

      if (!business) {
        res.status(404).json({ error: 'Business not found', message: 'Business not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          name: business.name,
          currency: business.currency,
          logoUrl: business.logoUrl ?? null,
          address: business.address ?? null,
          onboardingComplete: business.onboardingComplete,
        },
        message: 'Onboarding completed',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  },
);

businessRouter.put(
  '/onboarding/draft',
  requireBusinessRole(['OWNER']),
  async (req: Request, res: Response) => {
    try {
      const parsed = DraftSaveSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
        return;
      }

      const { field, value } = parsed.data;
      const businessId = (req.user as { memberships: { businessId: string }[] }).memberships[0]
        ?.businessId;
      if (!businessId) {
        res.status(400).json({ error: 'No business context', message: 'Missing business context' });
        return;
      }

      await businessService.saveDraft(businessId, field, value);
      res.status(200).json({ success: true, message: 'Draft saved' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
);

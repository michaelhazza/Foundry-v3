import { Router } from 'express';
import * as organizationService from '../services/organization.service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { organizationUpdateSchema } from '@shared/validators';

const router = Router();

// GET /api/organization - Get organization details
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const organization = await organizationService.getOrganization(req.user!.organizationId);

    res.json({
      data: organization,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organization - Update organization (admin only)
router.patch('/', requireAuth, requireAdmin, validate(organizationUpdateSchema), async (req, res, next) => {
  try {
    const { name } = req.body;
    const organization = await organizationService.updateOrganization(
      req.user!.organizationId,
      name,
      req.user!.id,
      req
    );

    res.json({
      data: organization,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

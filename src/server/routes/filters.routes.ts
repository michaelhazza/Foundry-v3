import { Router } from 'express';
import * as filterService from '../services/filter.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateFiltersSchema } from '@shared/validators';

const router = Router();

// GET /api/sources/:sourceId/filters - Get filter configuration
router.get('/:sourceId/filters', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const config = await filterService.getFilterConfig(sourceId, req.user!.organizationId);

    res.json({
      data: config,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sources/:sourceId/filters - Update filter configuration
router.put('/:sourceId/filters', requireAuth, validate(updateFiltersSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { filters } = req.body;

    const config = await filterService.updateFilterConfig(
      sourceId,
      req.user!.organizationId,
      filters,
      req.user!.id,
      req
    );

    res.json({
      data: config,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:sourceId/filters/summary - Get filter impact summary
router.get('/:sourceId/filters/summary', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const summary = await filterService.getFilterSummary(sourceId, req.user!.organizationId);

    res.json({
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

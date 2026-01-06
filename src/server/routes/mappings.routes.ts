import { Router } from 'express';
import * as mappingService from '../services/mapping.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateMappingSchema, mappingPreviewSchema } from '@shared/validators';

const router = Router();

// GET /api/sources/:sourceId/mapping - Get field mapping configuration
router.get('/:sourceId/mapping', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const mapping = await mappingService.getMapping(sourceId, req.user!.organizationId);

    res.json({
      data: mapping,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sources/:sourceId/mapping - Update field mapping configuration
router.put('/:sourceId/mapping', requireAuth, validate(updateMappingSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { mappings, customFields } = req.body;

    const mapping = await mappingService.updateMapping(
      sourceId,
      req.user!.organizationId,
      { mappings, customFields },
      req.user!.id,
      req
    );

    res.json({
      data: mapping,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:sourceId/mapping/suggestions - Get auto-generated mapping suggestions
router.get('/:sourceId/mapping/suggestions', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const suggestions = await mappingService.getMappingSuggestions(sourceId, req.user!.organizationId);

    res.json({
      data: { suggestions },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/mapping/preview - Preview mapped and transformed data
router.post('/:sourceId/mapping/preview', requireAuth, validate(mappingPreviewSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { limit } = req.body;

    const preview = await mappingService.previewMapping(sourceId, req.user!.organizationId, limit);

    res.json({
      data: {
        preview,
        recordCount: preview.length,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

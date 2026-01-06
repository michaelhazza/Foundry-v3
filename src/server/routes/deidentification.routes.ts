import { Router } from 'express';
import * as piiService from '../services/pii.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateDeidentificationSchema, deidentificationPreviewSchema, testPatternSchema } from '@shared/validators';

const router = Router();

// GET /api/sources/:sourceId/deidentification - Get de-identification configuration
router.get('/:sourceId/deidentification', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const config = await piiService.getDeidentificationConfig(sourceId, req.user!.organizationId);

    res.json({
      data: config,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sources/:sourceId/deidentification - Update de-identification configuration
router.put('/:sourceId/deidentification', requireAuth, validate(updateDeidentificationSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { rules, columnsToScan } = req.body;

    const config = await piiService.updateDeidentificationConfig(
      sourceId,
      req.user!.organizationId,
      { rules, columnsToScan },
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

// POST /api/sources/:sourceId/deidentification/scan - Trigger PII detection scan
router.post('/:sourceId/deidentification/scan', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const result = await piiService.scanForPii(sourceId, req.user!.organizationId);

    res.json({
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:sourceId/deidentification/summary - Get PII detection summary
router.get('/:sourceId/deidentification/summary', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const summary = await piiService.getPiiSummary(sourceId, req.user!.organizationId);

    res.json({
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/deidentification/preview - Preview de-identification results
router.post('/:sourceId/deidentification/preview', requireAuth, validate(deidentificationPreviewSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { limit } = req.body;

    const preview = await piiService.previewDeidentification(sourceId, req.user!.organizationId, limit);

    res.json({
      data: { preview },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/deidentification/test-pattern - Test a custom regex pattern
router.post('/:sourceId/deidentification/test-pattern', requireAuth, validate(testPatternSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { pattern, replacement } = req.body;

    const result = await piiService.testCustomPattern(
      sourceId,
      req.user!.organizationId,
      pattern,
      replacement
    );

    res.json({
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/deidentification/approve - Approve de-identification configuration
router.post('/:sourceId/deidentification/approve', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const result = await piiService.approveDeidentification(
      sourceId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

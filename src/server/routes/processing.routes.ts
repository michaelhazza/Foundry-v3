import { Router } from 'express';
import * as processingService from '../services/processing.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { startProcessingSchema, outputPreviewSchema } from '@shared/validators';

const router = Router();

// GET /api/sources/:sourceId/processing-runs - List processing runs for a source
router.get('/:sourceId/processing-runs', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const runs = await processingService.listProcessingRuns(sourceId, req.user!.organizationId);

    res.json({
      data: runs,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/process - Start processing
router.post('/:sourceId/process', requireAuth, validate(startProcessingSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { outputFormat } = req.body;

    const run = await processingService.startProcessing(
      sourceId,
      req.user!.organizationId,
      outputFormat,
      req.user!.id,
      req
    );

    res.status(201).json({
      data: run,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/processing-runs/:runId - Get processing run status
router.get('/runs/:runId', requireAuth, async (req, res, next) => {
  try {
    const runId = parseInt(req.params.runId, 10);
    const run = await processingService.getProcessingRun(runId, req.user!.organizationId);

    res.json({
      data: run,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/processing-runs/:runId/cancel - Cancel processing run
router.post('/runs/:runId/cancel', requireAuth, async (req, res, next) => {
  try {
    const runId = parseInt(req.params.runId, 10);
    await processingService.cancelProcessing(
      runId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'Processing cancelled' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/output-preview - Preview output format
router.post('/:sourceId/output-preview', requireAuth, validate(outputPreviewSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { format, limit } = req.body;

    const preview = await processingService.previewOutput(
      sourceId,
      req.user!.organizationId,
      format,
      limit
    );

    res.json({
      data: preview,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

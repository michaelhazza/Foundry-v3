import { Router } from 'express';
import * as outputService from '../services/output.service';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/sources/:sourceId/outputs - List outputs for a source
router.get('/sources/:sourceId/outputs', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const outputs = await outputService.listOutputs(sourceId, req.user!.organizationId);

    res.json({
      data: outputs,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/outputs/:outputId - Get output details
router.get('/:outputId', requireAuth, async (req, res, next) => {
  try {
    const outputId = parseInt(req.params.outputId, 10);
    const output = await outputService.getOutput(outputId, req.user!.organizationId);

    res.json({
      data: output,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/outputs/:outputId/preview - Preview output content
router.get('/:outputId/preview', requireAuth, async (req, res, next) => {
  try {
    const outputId = parseInt(req.params.outputId, 10);
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const preview = await outputService.previewOutput(
      outputId,
      req.user!.organizationId,
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

// GET /api/outputs/:outputId/download - Download output file
router.get('/:outputId/download', requireAuth, async (req, res, next) => {
  try {
    const outputId = parseInt(req.params.outputId, 10);

    const result = await outputService.downloadOutput(
      outputId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/outputs/:outputId - Delete output
router.delete('/:outputId', requireAuth, async (req, res, next) => {
  try {
    const outputId = parseInt(req.params.outputId, 10);

    await outputService.deleteOutput(
      outputId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'Output deleted successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

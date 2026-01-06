import { Router } from 'express';
import multer from 'multer';
import * as sourceService from '../services/source.service';
import * as teamworkService from '../services/teamwork.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationSchema, sourcePreviewSchema, updateSourceSchema, createApiSourceSchema } from '@shared/validators';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// GET /api/projects/:projectId/sources - List sources for a project
router.get('/projects/:projectId/sources', requireAuth, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const { page, limit, search } = req.query as any;

    const result = await sourceService.listSources(
      projectId,
      req.user!.organizationId,
      { page, limit, search }
    );

    res.json({
      data: result.sources,
      meta: {
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/sources/upload - Upload file source
router.post(
  '/projects/:projectId/sources/upload',
  requireAuth,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const file = req.file;
      const name = req.body.name || file?.originalname || 'Untitled';

      if (!file) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'No file provided' },
        });
      }

      const source = await sourceService.createFileSource(
        projectId,
        req.user!.organizationId,
        file,
        name,
        req.user!.id,
        req
      );

      res.status(201).json({
        data: source,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/projects/:projectId/sources/api - Create API source
router.post(
  '/projects/:projectId/sources/api',
  requireAuth,
  validate(createApiSourceSchema),
  async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const { connectionId, name, config } = req.body;

      const source = await teamworkService.createApiSource(
        projectId,
        req.user!.organizationId,
        { connectionId, name, config },
        req.user!.id
      );

      res.status(201).json({
        data: source,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/sources/:sourceId - Get source details
router.get('/:sourceId', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const source = await sourceService.getSource(sourceId, req.user!.organizationId);

    res.json({
      data: source,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/sources/:sourceId - Update source name
router.patch('/:sourceId', requireAuth, validate(updateSourceSchema), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const source = await sourceService.updateSource(
      sourceId,
      req.user!.organizationId,
      req.body,
      req.user!.id,
      req
    );

    res.json({
      data: source,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sources/:sourceId - Delete source
router.delete('/:sourceId', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    await sourceService.deleteSource(
      sourceId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'Source deleted successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:sourceId/preview - Preview source data
router.get('/:sourceId/preview', requireAuth, validate(sourcePreviewSchema, 'query'), async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const { page, limit, search } = req.query as any;

    const result = await sourceService.getSourcePreview(
      sourceId,
      req.user!.organizationId,
      { page, limit, search }
    );

    res.json({
      data: {
        columns: result.columns,
        rows: result.rows,
      },
      meta: {
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:sourceId/stats - Get source statistics
router.get('/:sourceId/stats', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const stats = await sourceService.getSourceStats(sourceId, req.user!.organizationId);

    res.json({
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/replace - Replace source file
router.post(
  '/:sourceId/replace',
  requireAuth,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const sourceId = parseInt(req.params.sourceId, 10);
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'No file provided' },
        });
      }

      // Get existing source
      const existingSource = await sourceService.getSource(sourceId, req.user!.organizationId);

      // Delete and recreate (simplified replace)
      await sourceService.deleteSource(sourceId, req.user!.organizationId, req.user!.id, req);

      const newSource = await sourceService.createFileSource(
        existingSource.projectId,
        req.user!.organizationId,
        file,
        existingSource.name,
        req.user!.id,
        req
      );

      res.json({
        data: {
          ...newSource,
          mappingsPreserved: false, // Would need more complex logic to preserve
          columnChanges: {
            added: newSource.columns || [],
            removed: existingSource.columns || [],
            unchanged: [],
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/sources/:sourceId/refresh - Refresh API source
router.post('/:sourceId/refresh', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseInt(req.params.sourceId, 10);
    const result = await teamworkService.refreshApiSource(sourceId, req.user!.organizationId);

    res.json({
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

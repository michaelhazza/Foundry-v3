import { Router } from 'express';
import * as connectionService from '../services/connection.service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createConnectionSchema, updateConnectionSchema } from '@shared/validators';

const router = Router();

// GET /api/connections - List API connections (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const connections = await connectionService.listConnections(req.user!.organizationId);

    res.json({
      data: connections,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/connections - Create API connection (admin only)
router.post('/', requireAuth, requireAdmin, validate(createConnectionSchema), async (req, res, next) => {
  try {
    const { type, name, credentials } = req.body;

    const connection = await connectionService.createConnection(
      req.user!.organizationId,
      { type, name, credentials },
      req.user!.id,
      req
    );

    res.status(201).json({
      data: connection,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/connections/:id - Get connection details (admin only)
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const connectionId = parseInt(req.params.id, 10);
    const connection = await connectionService.getConnection(
      connectionId,
      req.user!.organizationId
    );

    res.json({
      data: connection,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/connections/:id - Update connection (admin only)
router.patch('/:id', requireAuth, requireAdmin, validate(updateConnectionSchema), async (req, res, next) => {
  try {
    const connectionId = parseInt(req.params.id, 10);
    const { name, credentials } = req.body;

    const connection = await connectionService.updateConnection(
      connectionId,
      req.user!.organizationId,
      { name, credentials },
      req.user!.id,
      req
    );

    res.json({
      data: connection,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/connections/:id - Delete connection (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const connectionId = parseInt(req.params.id, 10);

    await connectionService.deleteConnection(
      connectionId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'Connection deleted successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/connections/:id/test - Test connection (admin only)
router.post('/:id/test', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const connectionId = parseInt(req.params.id, 10);

    const result = await connectionService.testConnection(
      connectionId,
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

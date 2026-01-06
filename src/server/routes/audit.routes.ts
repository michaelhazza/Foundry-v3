import { Router } from 'express';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { db } from '../db';
import { auditLogs, projects, users } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { auditLogQuerySchema } from '@shared/validators';

const router = Router();

// GET /api/projects/:projectId/audit-log - Get project audit log
router.get('/projects/:projectId/audit-log', requireAuth, validate(auditLogQuerySchema, 'query'), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const { page, limit, action, userId, startDate, endDate } = req.query as any;

    // Verify project access
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, req.user!.organizationId)
      ),
    });

    if (!project) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
    }

    // Build conditions
    const conditions: any[] = [
      eq(auditLogs.organizationId, req.user!.organizationId),
      eq(auditLogs.projectId, projectId),
    ];

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (userId) {
      conditions.push(eq(auditLogs.userId, parseInt(userId, 10)));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(and(...conditions));

    const total = totalResult[0].count;

    // Get logs
    const logs = await db.query.auditLogs.findMany({
      where: and(...conditions),
      with: {
        user: true,
      },
      orderBy: [desc(auditLogs.createdAt)],
      limit,
      offset,
    });

    res.json({
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        user: log.user ? { id: log.user.id, name: log.user.name } : null,
        createdAt: log.createdAt,
      })),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/audit-log - Get organization audit log (admin only)
router.get('/', requireAuth, validate(auditLogQuerySchema, 'query'), async (req, res, next) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const { page, limit, action, userId, startDate, endDate } = req.query as any;

    const conditions: any[] = [
      eq(auditLogs.organizationId, req.user!.organizationId),
    ];

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (userId) {
      conditions.push(eq(auditLogs.userId, parseInt(userId, 10)));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    const offset = (page - 1) * limit;

    const totalResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(and(...conditions));

    const total = totalResult[0].count;

    const logs = await db.query.auditLogs.findMany({
      where: and(...conditions),
      with: {
        user: true,
        project: true,
      },
      orderBy: [desc(auditLogs.createdAt)],
      limit,
      offset,
    });

    res.json({
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        user: log.user ? { id: log.user.id, name: log.user.name } : null,
        project: log.project ? { id: log.project.id, name: log.project.name } : null,
        createdAt: log.createdAt,
      })),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

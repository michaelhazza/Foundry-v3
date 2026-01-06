import { Router } from 'express';
import * as projectService from '../services/project.service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createProjectSchema, updateProjectSchema, paginationSchema } from '@shared/validators';

const router = Router();

// GET /api/projects - List projects
router.get('/', requireAuth, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, search } = req.query as any;
    const result = await projectService.listProjects(req.user!.organizationId, {
      page,
      limit,
      search,
    });

    res.json({
      data: result.projects,
      meta: {
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create project
router.post('/', requireAuth, validate(createProjectSchema), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await projectService.createProject(
      req.user!.organizationId,
      { name, description },
      req.user!.id,
      req
    );

    res.status(201).json({
      data: project,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const project = await projectService.getProject(projectId, req.user!.organizationId);

    res.json({
      data: project,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', requireAuth, validate(updateProjectSchema), async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const project = await projectService.updateProject(
      projectId,
      req.user!.organizationId,
      req.body,
      req.user!.id,
      req
    );

    res.json({
      data: project,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    await projectService.deleteProject(
      projectId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'Project deleted successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

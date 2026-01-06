import { Router } from 'express';
import * as userService from '../services/user.service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { changeRoleSchema } from '@shared/validators';

const router = Router();

// GET /api/users - List users (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await userService.listUsers(req.user!.organizationId);

    res.json({
      data: users,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user details (admin only)
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await userService.getUser(userId, req.user!.organizationId);

    res.json({
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/role - Change user role (admin only)
router.patch('/:id/role', requireAuth, requireAdmin, validate(changeRoleSchema), async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    const user = await userService.changeUserRole(
      targetUserId,
      role,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Remove user (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    await userService.removeUser(
      targetUserId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'User removed successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

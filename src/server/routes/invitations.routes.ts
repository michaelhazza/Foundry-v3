import { Router } from 'express';
import * as invitationService from '../services/invitation.service';
import * as authService from '../services/auth.service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { inviteUserSchema, acceptInvitationSchema } from '@shared/validators';
import { accessTokenCookieOptions, refreshTokenCookieOptions, generateAccessToken, generateRefreshToken } from '../lib/jwt';
import { hashToken } from '../lib/crypto';
import { db } from '../db';
import { refreshTokens } from '@shared/schema';

const router = Router();

// GET /api/invitations - List pending invitations (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const invitations = await invitationService.listInvitations(req.user!.organizationId);

    res.json({
      data: invitations,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/invitations - Create invitation (admin only)
router.post('/', requireAuth, requireAdmin, validate(inviteUserSchema), async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const invitation = await invitationService.createInvitation(
      req.user!.organizationId,
      email,
      role,
      req.user!.id,
      req
    );

    res.status(201).json({
      data: invitation,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invitations/validate - Validate invitation token (public)
router.get('/validate', async (req, res, next) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Token is required' },
      });
    }

    const result = await invitationService.validateInvitationToken(token);

    res.json({
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/invitations/accept - Accept invitation (public)
router.post('/accept', validate(acceptInvitationSchema), async (req, res, next) => {
  try {
    const { token, name, password } = req.body;
    const user = await invitationService.acceptInvitation(token, name, password, req);

    // Generate tokens and log user in
    const tokenPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    res.status(201).json({
      data: { user },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/invitations/:id/resend - Resend invitation (admin only)
router.post('/:id/resend', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const invitationId = parseInt(req.params.id, 10);
    await invitationService.resendInvitation(
      invitationId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'Invitation resent successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/invitations/:id - Cancel invitation (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const invitationId = parseInt(req.params.id, 10);
    await invitationService.cancelInvitation(
      invitationId,
      req.user!.organizationId,
      req.user!.id,
      req
    );

    res.json({
      data: { message: 'Invitation cancelled successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

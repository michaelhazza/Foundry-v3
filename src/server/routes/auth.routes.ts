import { Router } from 'express';
import * as authService from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  profileUpdateSchema,
} from '@shared/validators';
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../lib/jwt';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req);

    // Set cookies
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

    res.json({
      data: { user: result.user },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(req.user!.id, refreshToken, req);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({
      data: { message: 'Logged out successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'No refresh token' },
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

    res.json({
      data: { user: result.user },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);

    res.json({
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/auth/profile
router.patch('/profile', requireAuth, validate(profileUpdateSchema), async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await authService.updateProfile(req.user!.id, name, req);

    res.json({
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      data: { message: 'If the email exists, a reset link has been sent' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);

    res.json({
      data: { message: 'Password reset successfully' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword, req);

    // Clear cookies to force re-login
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({
      data: { message: 'Password changed successfully. Please log in again.' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

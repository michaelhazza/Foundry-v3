import { Request, Response, NextFunction } from 'express';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { users, organizations } from '@shared/schema';
import { verifyToken, TokenPayload } from '../lib/jwt';
import { UnauthorizedError, ForbiddenError } from '../errors';
import type { AuthUser } from '@shared/types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tokenPayload?: TokenPayload;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    // Get token from cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedError('No access token provided');
    }

    // Verify token
    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, payload.userId),
        eq(users.organizationId, payload.organizationId),
        isNull(users.deletedAt)
      ),
      with: {
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new UnauthorizedError('Account is locked');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    };
    req.tokenPayload = payload;

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = req.cookies?.accessToken;

  if (!token) {
    return next();
  }

  try {
    const payload = verifyToken(token);
    req.tokenPayload = payload;
  } catch {
    // Token invalid, continue without auth
  }

  next();
}

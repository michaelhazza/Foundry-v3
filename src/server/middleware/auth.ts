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

    // Validate token payload values before database query
    if (!Number.isFinite(payload.userId) || !Number.isFinite(payload.organizationId)) {
      throw new UnauthorizedError('Invalid token payload');
    }

    // Get user from database using core select API
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, payload.userId),
        eq(users.organizationId, payload.organizationId),
        isNull(users.deletedAt)
      ))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Get organization separately
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

    if (!organization) {
      throw new UnauthorizedError('Organization not found');
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
      organizationName: organization.name,
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

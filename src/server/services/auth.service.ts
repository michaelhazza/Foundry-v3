import bcrypt from 'bcrypt';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, refreshTokens, passwordResetTokens, organizations } from '@shared/schema';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../lib/jwt';
import { hashToken, generateSecureToken } from '../lib/crypto';
import { UnauthorizedError, NotFoundError, ValidationError, BadRequestError } from '../errors';
import { createAuditLog } from './audit.service';
import { sendEmail, generatePasswordResetEmail } from './email.service';
import { env } from '../config/env';
import type { AuthUser } from '@shared/types';
import { Request } from 'express';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function login(
  email: string,
  password: string,
  req?: Request
): Promise<LoginResult> {
  // Find user by email (across all organizations for now - could be scoped)
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.email, email.toLowerCase()),
      isNull(users.deletedAt)
    ),
    with: {
      organization: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const minutesRemaining = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
    );
    throw new UnauthorizedError(
      `Account is locked. Please try again in ${minutesRemaining} minutes.`
    );
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    // Increment failed attempts
    const newAttempts = user.failedLoginAttempts + 1;
    const updates: Partial<typeof users.$inferInsert> = {
      failedLoginAttempts: newAttempts,
      updatedAt: new Date(),
    };

    // Lock account if max attempts exceeded
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
      );
    }

    await db.update(users).set(updates).where(eq(users.id, user.id));

    throw new UnauthorizedError('Invalid email or password');
  }

  // Reset failed attempts on successful login
  await db.update(users).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token hash
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Create audit log
  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: 'user_login',
    req,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    },
    accessToken,
    refreshToken,
  };
}

export async function logout(userId: number, refreshToken?: string, req?: Request): Promise<void> {
  // Get user's org for audit log
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (refreshToken) {
    // Delete specific refresh token
    await db.delete(refreshTokens).where(
      and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tokenHash, hashToken(refreshToken))
      )
    );
  } else {
    // Delete all refresh tokens for user
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  if (user) {
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'user_logout',
      req,
    });
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<LoginResult> {
  const tokenHash = hashToken(refreshToken);

  // Find valid refresh token
  const storedToken = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, tokenHash),
      gt(refreshTokens.expiresAt, new Date())
    ),
    with: {
      user: {
        with: {
          organization: true,
        },
      },
    },
  });

  if (!storedToken || !storedToken.user) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = storedToken.user;

  if (user.deletedAt) {
    throw new UnauthorizedError('User account has been deleted');
  }

  // Delete old refresh token
  await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

  // Generate new tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Store new refresh token
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.email, email.toLowerCase()),
      isNull(users.deletedAt)
    ),
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return;
  }

  // Generate reset token
  const token = generateSecureToken();
  const tokenHash = hashToken(token);

  // Store token (expires in 1 hour)
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  // Send email
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset Your Foundry Password',
    html: generatePasswordResetEmail({
      resetUrl,
      userName: user.name,
    }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);

  // Find valid reset token
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      gt(passwordResetTokens.expiresAt, new Date()),
      isNull(passwordResetTokens.usedAt)
    ),
    with: {
      user: true,
    },
  });

  if (!resetToken) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and mark token as used
  await db.update(users).set({
    passwordHash,
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  }).where(eq(users.id, resetToken.userId));

  await db.update(passwordResetTokens).set({
    usedAt: new Date(),
  }).where(eq(passwordResetTokens.id, resetToken.id));

  // Invalidate all refresh tokens
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, resetToken.userId));
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  req?: Request
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify current password
  const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!passwordValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db.update(users).set({
    passwordHash,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  // Invalidate all refresh tokens (force re-login on other devices)
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  await createAuditLog({
    organizationId: user.organizationId,
    userId,
    action: 'user_updated',
    details: { passwordChanged: true },
    req,
  });
}

export async function updateProfile(
  userId: number,
  name: string,
  req?: Request
): Promise<AuthUser> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      organization: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  await db.update(users).set({
    name,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  await createAuditLog({
    organizationId: user.organizationId,
    userId,
    action: 'user_updated',
    details: { name },
    req,
  });

  return {
    id: user.id,
    email: user.email,
    name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
  };
}

export async function getCurrentUser(userId: number): Promise<AuthUser> {
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, userId),
      isNull(users.deletedAt)
    ),
    with: {
      organization: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
  };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

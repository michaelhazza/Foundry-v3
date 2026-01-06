import { eq, and, isNull, ne, count } from 'drizzle-orm';
import { db } from '../db';
import { users, refreshTokens } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { NotFoundError, ConflictError, ForbiddenError } from '../errors';
import type { UserRole, User } from '@shared/types';
import { Request } from 'express';

export interface UserWithStats {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function listUsers(organizationId: number): Promise<UserWithStats[]> {
  const results = await db.query.users.findMany({
    where: and(
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt)
    ),
    orderBy: (u, { asc }) => [asc(u.name)],
  });

  return results.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  }));
}

export async function getUser(
  userId: number,
  organizationId: number
): Promise<UserWithStats> {
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, userId),
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt)
    ),
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function changeUserRole(
  targetUserId: number,
  newRole: UserRole,
  organizationId: number,
  actingUserId: number,
  req?: Request
): Promise<UserWithStats> {
  // Can't change your own role
  if (targetUserId === actingUserId) {
    throw new ForbiddenError('Cannot change your own role');
  }

  const targetUser = await db.query.users.findFirst({
    where: and(
      eq(users.id, targetUserId),
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt)
    ),
  });

  if (!targetUser) {
    throw new NotFoundError('User');
  }

  // If demoting from admin, check there's at least one other admin
  if (targetUser.role === 'admin' && newRole !== 'admin') {
    const adminCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.role, 'admin'),
          isNull(users.deletedAt),
          ne(users.id, targetUserId)
        )
      );

    if (adminCount[0].count === 0) {
      throw new ConflictError('Cannot remove the last admin from the organization');
    }
  }

  await db.update(users).set({
    role: newRole,
    updatedAt: new Date(),
  }).where(eq(users.id, targetUserId));

  await createAuditLog({
    organizationId,
    userId: actingUserId,
    action: 'user_role_changed',
    details: {
      targetUserId,
      previousRole: targetUser.role,
      newRole,
    },
    req,
  });

  return {
    id: targetUser.id,
    email: targetUser.email,
    name: targetUser.name,
    role: newRole,
    lastLoginAt: targetUser.lastLoginAt,
    createdAt: targetUser.createdAt,
  };
}

export async function removeUser(
  targetUserId: number,
  organizationId: number,
  actingUserId: number,
  req?: Request
): Promise<void> {
  // Can't remove yourself
  if (targetUserId === actingUserId) {
    throw new ForbiddenError('Cannot remove yourself');
  }

  const targetUser = await db.query.users.findFirst({
    where: and(
      eq(users.id, targetUserId),
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt)
    ),
  });

  if (!targetUser) {
    throw new NotFoundError('User');
  }

  // If removing an admin, check there's at least one other admin
  if (targetUser.role === 'admin') {
    const adminCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.role, 'admin'),
          isNull(users.deletedAt),
          ne(users.id, targetUserId)
        )
      );

    if (adminCount[0].count === 0) {
      throw new ConflictError('Cannot remove the last admin from the organization');
    }
  }

  // Soft delete user
  await db.update(users).set({
    deletedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, targetUserId));

  // Delete all refresh tokens
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, targetUserId));

  await createAuditLog({
    organizationId,
    userId: actingUserId,
    action: 'user_deleted',
    details: {
      targetUserId,
      email: targetUser.email,
    },
    req,
  });
}

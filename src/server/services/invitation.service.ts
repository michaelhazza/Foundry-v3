import bcrypt from 'bcrypt';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { invitations, users, organizations } from '@shared/schema';
import { hashToken, generateSecureToken } from '../lib/crypto';
import { hashPassword } from './auth.service';
import { sendEmail, generateInvitationEmail } from './email.service';
import { createAuditLog } from './audit.service';
import { NotFoundError, ConflictError, BadRequestError, ValidationError } from '../errors';
import { env } from '../config/env';
import type { UserRole, AuthUser } from '@shared/types';
import { Request } from 'express';

const INVITATION_EXPIRY_DAYS = 7;

export interface InvitationWithInviter {
  id: number;
  email: string;
  role: UserRole;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    id: number;
    name: string;
  };
}

export async function createInvitation(
  organizationId: number,
  email: string,
  role: UserRole,
  invitedById: number,
  req?: Request
): Promise<InvitationWithInviter> {
  const normalizedEmail = email.toLowerCase();

  // Check if user already exists in organization
  const existingUser = await db.query.users.findFirst({
    where: and(
      eq(users.email, normalizedEmail),
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt)
    ),
  });

  if (existingUser) {
    throw new ConflictError('User already exists in this organization');
  }

  // Check for existing pending invitation
  const existingInvitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.email, normalizedEmail),
      eq(invitations.organizationId, organizationId),
      eq(invitations.status, 'pending')
    ),
  });

  if (existingInvitation) {
    throw new ConflictError('An invitation has already been sent to this email');
  }

  // Get inviter and organization info
  const inviter = await db.query.users.findFirst({
    where: eq(users.id, invitedById),
    with: {
      organization: true,
    },
  });

  if (!inviter) {
    throw new NotFoundError('Inviter');
  }

  // Generate invitation token
  const token = generateSecureToken();
  const tokenHash = hashToken(token);

  // Create invitation
  const [invitation] = await db.insert(invitations).values({
    organizationId,
    email: normalizedEmail,
    role,
    tokenHash,
    invitedById,
    expiresAt: new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  }).returning();

  // Send invitation email
  const inviteUrl = `${env.APP_URL}/invitations/accept?token=${token}`;
  await sendEmail({
    to: normalizedEmail,
    subject: `You've been invited to join ${inviter.organization.name} on Foundry`,
    html: generateInvitationEmail({
      inviteUrl,
      organizationName: inviter.organization.name,
      inviterName: inviter.name,
    }),
  });

  // Create audit log
  await createAuditLog({
    organizationId,
    userId: invitedById,
    action: 'invitation_created',
    details: { email: normalizedEmail, role },
    req,
  });

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    invitedBy: {
      id: inviter.id,
      name: inviter.name,
    },
  };
}

export async function validateInvitationToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  organizationName?: string;
  message?: string;
}> {
  const tokenHash = hashToken(token);

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.tokenHash, tokenHash),
    with: {
      organization: true,
    },
  });

  if (!invitation) {
    return { valid: false, message: 'Invalid invitation token' };
  }

  if (invitation.status !== 'pending') {
    return { valid: false, message: `Invitation has already been ${invitation.status}` };
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    return { valid: false, message: 'Invitation has expired' };
  }

  return {
    valid: true,
    email: invitation.email,
    organizationName: invitation.organization.name,
  };
}

export async function acceptInvitation(
  token: string,
  name: string,
  password: string,
  req?: Request
): Promise<AuthUser> {
  const tokenHash = hashToken(token);

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.tokenHash, tokenHash),
    with: {
      organization: true,
    },
  });

  if (!invitation) {
    throw new BadRequestError('Invalid invitation token');
  }

  if (invitation.status !== 'pending') {
    throw new BadRequestError(`Invitation has already been ${invitation.status}`);
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    throw new BadRequestError('Invitation has expired');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db.insert(users).values({
    organizationId: invitation.organizationId,
    email: invitation.email,
    passwordHash,
    name,
    role: invitation.role,
  }).returning();

  // Update invitation status
  await db.update(invitations).set({
    status: 'accepted',
    acceptedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(invitations.id, invitation.id));

  // Create audit logs
  await createAuditLog({
    organizationId: invitation.organizationId,
    userId: newUser.id,
    action: 'invitation_accepted',
    details: { email: invitation.email },
    req,
  });

  await createAuditLog({
    organizationId: invitation.organizationId,
    userId: newUser.id,
    action: 'user_created',
    details: { email: invitation.email, role: invitation.role },
    req,
  });

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    organizationId: newUser.organizationId,
    organizationName: invitation.organization.name,
  };
}

export async function resendInvitation(
  invitationId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<void> {
  const invitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.id, invitationId),
      eq(invitations.organizationId, organizationId),
      eq(invitations.status, 'pending')
    ),
    with: {
      organization: true,
      invitedBy: true,
    },
  });

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  // Generate new token
  const token = generateSecureToken();
  const tokenHash = hashToken(token);

  // Update invitation with new token and extended expiry
  await db.update(invitations).set({
    tokenHash,
    expiresAt: new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  }).where(eq(invitations.id, invitationId));

  // Resend email
  const inviteUrl = `${env.APP_URL}/invitations/accept?token=${token}`;
  await sendEmail({
    to: invitation.email,
    subject: `Reminder: You've been invited to join ${invitation.organization.name} on Foundry`,
    html: generateInvitationEmail({
      inviteUrl,
      organizationName: invitation.organization.name,
      inviterName: invitation.invitedBy.name,
    }),
  });
}

export async function cancelInvitation(
  invitationId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<void> {
  const invitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.id, invitationId),
      eq(invitations.organizationId, organizationId),
      eq(invitations.status, 'pending')
    ),
  });

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  await db.update(invitations).set({
    status: 'cancelled',
    updatedAt: new Date(),
  }).where(eq(invitations.id, invitationId));

  await createAuditLog({
    organizationId,
    userId,
    action: 'invitation_cancelled',
    details: { email: invitation.email },
    req,
  });
}

export async function listInvitations(organizationId: number): Promise<InvitationWithInviter[]> {
  const results = await db.query.invitations.findMany({
    where: and(
      eq(invitations.organizationId, organizationId),
      eq(invitations.status, 'pending')
    ),
    with: {
      invitedBy: true,
    },
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  });

  return results.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    invitedBy: {
      id: inv.invitedBy.id,
      name: inv.invitedBy.name,
    },
  }));
}

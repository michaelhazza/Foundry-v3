import { eq, isNull, count } from 'drizzle-orm';
import { db } from '../db';
import { organizations, users, projects } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { NotFoundError } from '../errors';
import { Request } from 'express';

export interface OrganizationWithStats {
  id: number;
  name: string;
  userCount: number;
  projectCount: number;
  createdAt: Date;
}

export async function getOrganization(
  organizationId: number
): Promise<OrganizationWithStats> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    throw new NotFoundError('Organization');
  }

  // Count users
  const userResult = await db
    .select({ count: count() })
    .from(users)
    .where(
      eq(users.organizationId, organizationId)
    );

  // Count projects
  const projectResult = await db
    .select({ count: count() })
    .from(projects)
    .where(
      eq(projects.organizationId, organizationId)
    );

  return {
    id: org.id,
    name: org.name,
    userCount: userResult[0].count,
    projectCount: projectResult[0].count,
    createdAt: org.createdAt,
  };
}

export async function updateOrganization(
  organizationId: number,
  name: string,
  userId: number,
  req?: Request
): Promise<OrganizationWithStats> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    throw new NotFoundError('Organization');
  }

  await db.update(organizations).set({
    name,
    updatedAt: new Date(),
  }).where(eq(organizations.id, organizationId));

  await createAuditLog({
    organizationId,
    userId,
    action: 'organization_updated',
    details: {
      previousName: org.name,
      newName: name,
    },
    req,
  });

  return getOrganization(organizationId);
}

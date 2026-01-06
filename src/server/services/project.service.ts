import { eq, and, isNull, ilike, count, desc } from 'drizzle-orm';
import { db } from '../db';
import { projects, sources } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { NotFoundError, ConflictError } from '../errors';
import type { Project, PaginationMeta } from '@shared/types';
import { Request } from 'express';

export interface ProjectWithStats {
  id: number;
  name: string;
  description: string | null;
  sourceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectListResult {
  projects: ProjectWithStats[];
  pagination: PaginationMeta;
}

export async function listProjects(
  organizationId: number,
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<ProjectListResult> {
  const { page = 1, limit = 20, search } = options;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [
    eq(projects.organizationId, organizationId),
    isNull(projects.deletedAt),
  ];

  if (search) {
    conditions.push(ilike(projects.name, `%${search}%`));
  }

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(projects)
    .where(and(...conditions));

  const total = totalResult[0].count;

  // Get projects
  const projectList = await db.query.projects.findMany({
    where: and(...conditions),
    orderBy: [desc(projects.updatedAt)],
    limit,
    offset,
  });

  // Get source counts for each project
  const projectsWithStats: ProjectWithStats[] = await Promise.all(
    projectList.map(async (project) => {
      const sourceResult = await db
        .select({ count: count() })
        .from(sources)
        .where(
          and(
            eq(sources.projectId, project.id),
            isNull(sources.deletedAt)
          )
        );

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        sourceCount: sourceResult[0].count,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    })
  );

  return {
    projects: projectsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function getProject(
  projectId: number,
  organizationId: number
): Promise<ProjectWithStats> {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    ),
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  const sourceResult = await db
    .select({ count: count() })
    .from(sources)
    .where(
      and(
        eq(sources.projectId, project.id),
        isNull(sources.deletedAt)
      )
    );

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    sourceCount: sourceResult[0].count,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function createProject(
  organizationId: number,
  data: { name: string; description?: string },
  userId: number,
  req?: Request
): Promise<ProjectWithStats> {
  const [project] = await db.insert(projects).values({
    organizationId,
    name: data.name,
    description: data.description || null,
  }).returning();

  await createAuditLog({
    organizationId,
    userId,
    projectId: project.id,
    action: 'project_created',
    details: { name: data.name },
    req,
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    sourceCount: 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function updateProject(
  projectId: number,
  organizationId: number,
  data: { name?: string; description?: string },
  userId: number,
  req?: Request
): Promise<ProjectWithStats> {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    ),
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  const updateData: Partial<typeof projects.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  await db.update(projects).set(updateData).where(eq(projects.id, projectId));

  await createAuditLog({
    organizationId,
    userId,
    projectId,
    action: 'project_updated',
    details: data,
    req,
  });

  return getProject(projectId, organizationId);
}

export async function deleteProject(
  projectId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<void> {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    ),
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Soft delete the project (cascades to sources via application logic)
  await db.update(projects).set({
    deletedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(projects.id, projectId));

  // Also soft delete all sources
  await db.update(sources).set({
    deletedAt: new Date(),
    updatedAt: new Date(),
  }).where(
    and(
      eq(sources.projectId, projectId),
      isNull(sources.deletedAt)
    )
  );

  await createAuditLog({
    organizationId,
    userId,
    projectId,
    action: 'project_deleted',
    details: { name: project.name },
    req,
  });
}

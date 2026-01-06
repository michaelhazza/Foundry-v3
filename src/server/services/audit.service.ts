import { db } from '../db';
import { auditLogs } from '@shared/schema';
import type { AuditAction } from '@shared/types';
import { Request } from 'express';

export interface AuditLogParams {
  organizationId: number;
  userId?: number;
  projectId?: number;
  sourceId?: number;
  action: AuditAction;
  details?: Record<string, unknown>;
  req?: Request;
}

export async function createAuditLog(params: AuditLogParams) {
  const { organizationId, userId, projectId, sourceId, action, details, req } = params;

  await db.insert(auditLogs).values({
    organizationId,
    userId: userId ?? null,
    projectId: projectId ?? null,
    sourceId: sourceId ?? null,
    action,
    details: details ?? null,
    ipAddress: req?.ip ?? null,
    userAgent: req?.get('user-agent') ?? null,
  });
}

import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '../db';
import { apiConnections, sources } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { encrypt, decrypt } from '../lib/crypto';
import { NotFoundError, ConflictError, BadGatewayError } from '../errors';
import type { ConnectionType, ConnectionStatus } from '@shared/types';
import { Request } from 'express';

export interface ConnectionResponse {
  id: number;
  name: string;
  type: ConnectionType;
  status: ConnectionStatus;
  lastTestedAt: Date | null;
  errorMessage: string | null;
  sourceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function listConnections(
  organizationId: number
): Promise<ConnectionResponse[]> {
  // Validate organizationId to prevent NaN issues
  if (!Number.isFinite(organizationId)) {
    return [];
  }

  // Use core select API
  const connections = await db
    .select()
    .from(apiConnections)
    .where(eq(apiConnections.organizationId, organizationId))
    .orderBy(desc(apiConnections.createdAt));

  const results: ConnectionResponse[] = [];

  for (const conn of connections) {
    const sourceResult = await db
      .select({ count: count() })
      .from(sources)
      .where(eq(sources.connectionId, conn.id));

    results.push({
      id: conn.id,
      name: conn.name,
      type: conn.type,
      status: conn.status,
      lastTestedAt: conn.lastTestedAt,
      errorMessage: conn.errorMessage,
      sourceCount: sourceResult[0].count,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
    });
  }

  return results;
}

export async function getConnection(
  connectionId: number,
  organizationId: number
): Promise<ConnectionResponse> {
  // Validate inputs
  if (!Number.isFinite(connectionId) || !Number.isFinite(organizationId)) {
    throw new NotFoundError('API connection');
  }

  const [connection] = await db
    .select()
    .from(apiConnections)
    .where(and(
      eq(apiConnections.id, connectionId),
      eq(apiConnections.organizationId, organizationId)
    ))
    .limit(1);

  if (!connection) {
    throw new NotFoundError('API connection');
  }

  const sourceResult = await db
    .select({ count: count() })
    .from(sources)
    .where(eq(sources.connectionId, connectionId));

  return {
    id: connection.id,
    name: connection.name,
    type: connection.type,
    status: connection.status,
    lastTestedAt: connection.lastTestedAt,
    errorMessage: connection.errorMessage,
    sourceCount: sourceResult[0].count,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}

export async function createConnection(
  organizationId: number,
  data: {
    type: ConnectionType;
    name: string;
    credentials: { apiKey: string; subdomain: string };
  },
  userId: number,
  req?: Request
): Promise<ConnectionResponse> {
  // Encrypt credentials
  const credentialsJson = JSON.stringify(data.credentials);
  const encrypted = encrypt(credentialsJson);

  const [connection] = await db.insert(apiConnections).values({
    organizationId,
    name: data.name,
    type: data.type,
    credentialsEncrypted: encrypted.encrypted,
    credentialsIv: encrypted.iv,
    credentialsAuthTag: encrypted.authTag,
    status: 'inactive',
  }).returning();

  await createAuditLog({
    organizationId,
    userId,
    action: 'connection_created',
    details: { connectionId: connection.id, name: data.name, type: data.type },
    req,
  });

  return getConnection(connection.id, organizationId);
}

export async function updateConnection(
  connectionId: number,
  organizationId: number,
  data: {
    name?: string;
    credentials?: { apiKey: string; subdomain: string };
  },
  userId: number,
  req?: Request
): Promise<ConnectionResponse> {
  // Validate inputs
  if (!Number.isFinite(connectionId) || !Number.isFinite(organizationId)) {
    throw new NotFoundError('API connection');
  }

  const [connection] = await db
    .select()
    .from(apiConnections)
    .where(and(
      eq(apiConnections.id, connectionId),
      eq(apiConnections.organizationId, organizationId)
    ))
    .limit(1);

  if (!connection) {
    throw new NotFoundError('API connection');
  }

  const updateData: Partial<typeof apiConnections.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.credentials !== undefined) {
    const credentialsJson = JSON.stringify(data.credentials);
    const encrypted = encrypt(credentialsJson);
    updateData.credentialsEncrypted = encrypted.encrypted;
    updateData.credentialsIv = encrypted.iv;
    updateData.credentialsAuthTag = encrypted.authTag;
    updateData.status = 'inactive'; // Reset status when credentials change
  }

  await db.update(apiConnections).set(updateData).where(eq(apiConnections.id, connectionId));

  await createAuditLog({
    organizationId,
    userId,
    action: 'connection_updated',
    details: { connectionId, name: data.name },
    req,
  });

  return getConnection(connectionId, organizationId);
}

export async function deleteConnection(
  connectionId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<void> {
  // Validate inputs
  if (!Number.isFinite(connectionId) || !Number.isFinite(organizationId)) {
    throw new NotFoundError('API connection');
  }

  const [connection] = await db
    .select()
    .from(apiConnections)
    .where(and(
      eq(apiConnections.id, connectionId),
      eq(apiConnections.organizationId, organizationId)
    ))
    .limit(1);

  if (!connection) {
    throw new NotFoundError('API connection');
  }

  // Check if any sources use this connection
  const sourceResult = await db
    .select({ count: count() })
    .from(sources)
    .where(eq(sources.connectionId, connectionId));

  if (sourceResult[0].count > 0) {
    throw new ConflictError('Cannot delete connection that is used by sources');
  }

  await db.delete(apiConnections).where(eq(apiConnections.id, connectionId));

  await createAuditLog({
    organizationId,
    userId,
    action: 'connection_deleted',
    details: { connectionId, name: connection.name },
    req,
  });
}

export async function testConnection(
  connectionId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<{ success: boolean; message: string }> {
  // Validate inputs
  if (!Number.isFinite(connectionId) || !Number.isFinite(organizationId)) {
    throw new NotFoundError('API connection');
  }

  const [connection] = await db
    .select()
    .from(apiConnections)
    .where(and(
      eq(apiConnections.id, connectionId),
      eq(apiConnections.organizationId, organizationId)
    ))
    .limit(1);

  if (!connection) {
    throw new NotFoundError('API connection');
  }

  // Decrypt credentials
  const credentialsJson = decrypt(
    connection.credentialsEncrypted,
    connection.credentialsIv,
    connection.credentialsAuthTag
  );
  const credentials = JSON.parse(credentialsJson) as { apiKey: string; subdomain: string };

  try {
    // Test connection based on type
    if (connection.type === 'teamwork_desk') {
      await testTeamworkConnection(credentials);
    }

    // Update status to active
    await db.update(apiConnections).set({
      status: 'active',
      lastTestedAt: new Date(),
      errorMessage: null,
      updatedAt: new Date(),
    }).where(eq(apiConnections.id, connectionId));

    await createAuditLog({
      organizationId,
      userId,
      action: 'connection_tested',
      details: { connectionId, success: true },
      req,
    });

    return { success: true, message: 'Connection successful' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';

    await db.update(apiConnections).set({
      status: 'error',
      lastTestedAt: new Date(),
      errorMessage,
      updatedAt: new Date(),
    }).where(eq(apiConnections.id, connectionId));

    await createAuditLog({
      organizationId,
      userId,
      action: 'connection_tested',
      details: { connectionId, success: false, error: errorMessage },
      req,
    });

    return { success: false, message: errorMessage };
  }
}

async function testTeamworkConnection(credentials: { apiKey: string; subdomain: string }): Promise<void> {
  const url = `https://${credentials.subdomain}.teamwork.com/desk/v1/me.json`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:x`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key');
    } else if (response.status === 404) {
      throw new Error('Invalid subdomain');
    } else {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
  }
}

export function getDecryptedCredentials(connection: {
  credentialsEncrypted: string;
  credentialsIv: string;
  credentialsAuthTag: string;
}): { apiKey: string; subdomain: string } {
  const credentialsJson = decrypt(
    connection.credentialsEncrypted,
    connection.credentialsIv,
    connection.credentialsAuthTag
  );
  return JSON.parse(credentialsJson);
}

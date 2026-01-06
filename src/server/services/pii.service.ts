import { eq } from 'drizzle-orm';
import { db } from '../db';
import { deidentificationConfigs, sourceData } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { getSource } from './source.service';
import { NotFoundError, BadRequestError, ValidationError } from '../errors';
import { detectPii, detectCustomPattern } from '../lib/pii/detector';
import { deidentifyRecord, applyDeidentification } from '../lib/pii/replacer';
import type { DeidentificationRule, PiiScanSummary } from '@shared/types';
import { Request } from 'express';

export interface DeidentificationConfigResponse {
  sourceId: number;
  rules: DeidentificationRule[];
  columnsToScan: string[];
  piiScanResults: {
    summary: Record<string, number>;
    byColumn: Record<string, Record<string, number>>;
    samples: Array<{
      type: string;
      column: string;
      originalValue: string;
      rowIndex: number;
    }>;
    scannedAt: string;
  } | null;
  approvedAt: Date | null;
  approvedBy: { id: number; name: string } | null;
  updatedAt: Date;
}

export async function getDeidentificationConfig(
  sourceId: number,
  organizationId: number
): Promise<DeidentificationConfigResponse> {
  const source = await getSource(sourceId, organizationId);

  const config = await db.query.deidentificationConfigs.findFirst({
    where: eq(deidentificationConfigs.sourceId, sourceId),
    with: {
      approvedBy: true,
    },
  });

  if (!config) {
    throw new NotFoundError('De-identification configuration');
  }

  return {
    sourceId: config.sourceId,
    rules: config.rules,
    columnsToScan: config.columnsToScan || [],
    piiScanResults: config.piiScanResults,
    approvedAt: config.approvedAt,
    approvedBy: config.approvedBy ? {
      id: config.approvedBy.id,
      name: config.approvedBy.name,
    } : null,
    updatedAt: config.updatedAt,
  };
}

export async function updateDeidentificationConfig(
  sourceId: number,
  organizationId: number,
  data: { rules?: DeidentificationRule[]; columnsToScan?: string[] },
  userId: number,
  req?: Request
): Promise<DeidentificationConfigResponse> {
  const source = await getSource(sourceId, organizationId);

  // Validate custom patterns
  if (data.rules) {
    for (const rule of data.rules) {
      if (rule.type === 'custom' && rule.pattern) {
        try {
          new RegExp(rule.pattern);
        } catch {
          throw new ValidationError(`Invalid regex pattern in rule "${rule.id}"`);
        }
      }
    }
  }

  // Validate columns exist
  if (data.columnsToScan) {
    const sourceColumns = source.columns || [];
    for (const col of data.columnsToScan) {
      if (!sourceColumns.includes(col)) {
        throw new BadRequestError(`Column "${col}" does not exist in source`);
      }
    }
  }

  const updateData: Partial<typeof deidentificationConfigs.$inferInsert> = {
    updatedAt: new Date(),
    approvedAt: null, // Reset approval when config changes
    approvedById: null,
  };

  if (data.rules !== undefined) updateData.rules = data.rules;
  if (data.columnsToScan !== undefined) updateData.columnsToScan = data.columnsToScan;

  await db.update(deidentificationConfigs).set(updateData)
    .where(eq(deidentificationConfigs.sourceId, sourceId));

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId,
    action: 'deidentification_updated',
    details: {
      rulesCount: data.rules?.length,
      columnsToScan: data.columnsToScan,
    },
    req,
  });

  return getDeidentificationConfig(sourceId, organizationId);
}

export async function scanForPii(
  sourceId: number,
  organizationId: number
): Promise<{
  status: string;
  summary?: Record<string, number>;
  byColumn?: Record<string, Record<string, number>>;
  samples?: Array<{
    type: string;
    column: string;
    originalValue: string;
    rowIndex: number;
  }>;
  totalPiiInstances?: number;
  scannedAt?: string;
}> {
  const source = await getSource(sourceId, organizationId);
  const config = await db.query.deidentificationConfigs.findFirst({
    where: eq(deidentificationConfigs.sourceId, sourceId),
  });

  if (!config) {
    throw new NotFoundError('De-identification configuration');
  }

  const columnsToScan = config.columnsToScan || [];
  if (columnsToScan.length === 0) {
    throw new BadRequestError('No columns configured for scanning');
  }

  // Get all source data
  const rows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
    orderBy: (sd, { asc }) => [asc(sd.rowIndex)],
  });

  const summary: Record<string, number> = {
    names: 0,
    emails: 0,
    phones: 0,
    addresses: 0,
    companies: 0,
    custom: 0,
  };

  const byColumn: Record<string, Record<string, number>> = {};
  const samples: Array<{
    type: string;
    column: string;
    originalValue: string;
    rowIndex: number;
  }> = [];

  for (const row of rows) {
    for (const column of columnsToScan) {
      const value = row.data[column];
      if (!value || typeof value !== 'string') continue;

      const detection = detectPii(value);

      if (!byColumn[column]) {
        byColumn[column] = {};
      }

      for (const [type, count] of Object.entries(detection.counts)) {
        if (count > 0) {
          summary[type] = (summary[type] || 0) + count;
          byColumn[column][type] = (byColumn[column][type] || 0) + count;

          // Collect samples (limit to 10 per type)
          if (samples.filter((s) => s.type === type).length < 10) {
            const match = detection.matches.find((m) => m.type === type);
            if (match) {
              samples.push({
                type,
                column,
                originalValue: match.value,
                rowIndex: row.rowIndex,
              });
            }
          }
        }
      }

      // Check custom patterns
      for (const rule of config.rules) {
        if (rule.type === 'custom' && rule.pattern && rule.enabled) {
          try {
            const customMatches = detectCustomPattern(value, rule.pattern);
            if (customMatches.length > 0) {
              summary.custom = (summary.custom || 0) + customMatches.length;
              byColumn[column].custom = (byColumn[column].custom || 0) + customMatches.length;

              if (samples.filter((s) => s.type === 'custom').length < 10) {
                samples.push({
                  type: 'custom',
                  column,
                  originalValue: customMatches[0].value,
                  rowIndex: row.rowIndex,
                });
              }
            }
          } catch {
            // Skip invalid patterns
          }
        }
      }
    }
  }

  const scannedAt = new Date().toISOString();

  // Save scan results
  await db.update(deidentificationConfigs).set({
    piiScanResults: {
      summary,
      byColumn,
      samples,
      scannedAt,
    },
    updatedAt: new Date(),
  }).where(eq(deidentificationConfigs.sourceId, sourceId));

  const totalPiiInstances = Object.values(summary).reduce((a, b) => a + b, 0);

  return {
    status: 'complete',
    summary,
    byColumn,
    samples,
    totalPiiInstances,
    scannedAt,
  };
}

export async function getPiiSummary(
  sourceId: number,
  organizationId: number
): Promise<{
  scannedAt: string | null;
  summary: Record<string, number>;
  byColumn: Record<string, Record<string, number>>;
  totalPiiInstances: number;
  percentageOfRecords: number;
}> {
  const source = await getSource(sourceId, organizationId);
  const config = await db.query.deidentificationConfigs.findFirst({
    where: eq(deidentificationConfigs.sourceId, sourceId),
  });

  if (!config || !config.piiScanResults) {
    throw new NotFoundError('PII scan results (scan not yet performed)');
  }

  const results = config.piiScanResults;
  const totalPiiInstances = Object.values(results.summary).reduce((a, b) => a + b, 0);

  // Calculate percentage of records with PII
  const recordsWithPii = new Set(results.samples.map((s) => s.rowIndex)).size;
  const percentageOfRecords = source.rowCount
    ? Math.round((recordsWithPii / source.rowCount) * 100 * 10) / 10
    : 0;

  return {
    scannedAt: results.scannedAt,
    summary: results.summary,
    byColumn: results.byColumn,
    totalPiiInstances,
    percentageOfRecords,
  };
}

export async function previewDeidentification(
  sourceId: number,
  organizationId: number,
  limit: number = 10
): Promise<Array<{
  rowIndex: number;
  original: Record<string, unknown>;
  deidentified: Record<string, unknown>;
  piiHighlights: Array<{ type: string; start: number; end: number; column: string }>;
}>> {
  const source = await getSource(sourceId, organizationId);
  const config = await db.query.deidentificationConfigs.findFirst({
    where: eq(deidentificationConfigs.sourceId, sourceId),
  });

  if (!config) {
    throw new NotFoundError('De-identification configuration');
  }

  const rows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
    limit,
    orderBy: (sd, { asc }) => [asc(sd.rowIndex)],
  });

  return rows.map((row) => {
    const result = deidentifyRecord(
      row.data,
      config.columnsToScan || [],
      config.rules
    );

    return {
      rowIndex: row.rowIndex,
      original: result.original,
      deidentified: result.deidentified,
      piiHighlights: result.piiHighlights,
    };
  });
}

export async function testCustomPattern(
  sourceId: number,
  organizationId: number,
  pattern: string,
  replacement: string
): Promise<{
  valid: boolean;
  error?: string;
  matches: Array<{
    rowIndex: number;
    column: string;
    original: string;
    replaced: string;
  }>;
  matchCount: number;
}> {
  const source = await getSource(sourceId, organizationId);
  const config = await db.query.deidentificationConfigs.findFirst({
    where: eq(deidentificationConfigs.sourceId, sourceId),
  });

  if (!config) {
    throw new NotFoundError('De-identification configuration');
  }

  // Validate pattern
  try {
    new RegExp(pattern);
  } catch (error) {
    return {
      valid: false,
      error: `Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}`,
      matches: [],
      matchCount: 0,
    };
  }

  // Get sample data
  const rows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
    limit: 1000,
  });

  const matches: Array<{
    rowIndex: number;
    column: string;
    original: string;
    replaced: string;
  }> = [];

  let matchCount = 0;

  for (const row of rows) {
    for (const column of config.columnsToScan || []) {
      const value = row.data[column];
      if (!value || typeof value !== 'string') continue;

      const foundMatches = detectCustomPattern(value, pattern);
      matchCount += foundMatches.length;

      if (foundMatches.length > 0 && matches.length < 10) {
        // Apply replacement
        let replaced = value;
        const regex = new RegExp(pattern, 'g');
        replaced = replaced.replace(regex, replacement);

        matches.push({
          rowIndex: row.rowIndex,
          column,
          original: value,
          replaced,
        });
      }
    }
  }

  return {
    valid: true,
    matches,
    matchCount,
  };
}

export async function approveDeidentification(
  sourceId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<{ approvedAt: Date; approvedBy: { id: number; name: string } }> {
  const source = await getSource(sourceId, organizationId);
  const config = await db.query.deidentificationConfigs.findFirst({
    where: eq(deidentificationConfigs.sourceId, sourceId),
  });

  if (!config) {
    throw new NotFoundError('De-identification configuration');
  }

  if (!config.rules || config.rules.length === 0) {
    throw new ValidationError('No de-identification rules configured');
  }

  await db.update(deidentificationConfigs).set({
    approvedAt: new Date(),
    approvedById: userId,
    updatedAt: new Date(),
  }).where(eq(deidentificationConfigs.sourceId, sourceId));

  const user = await db.query.users.findFirst({
    where: eq(deidentificationConfigs.approvedById, userId),
  });

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId,
    action: 'deidentification_approved',
    req,
  });

  return {
    approvedAt: new Date(),
    approvedBy: {
      id: userId,
      name: user?.name || 'Unknown',
    },
  };
}

import { eq, and, isNull, ilike, count, desc } from 'drizzle-orm';
import { db } from '../db';
import { sources, sourceData, projects, fieldMappings, deidentificationConfigs, filterConfigs, processingRuns } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { NotFoundError, ConflictError, BadRequestError } from '../errors';
import { parseCSV } from '../lib/parsers/csv';
import { parseExcel } from '../lib/parsers/excel';
import { parseJSON, parseJSONL } from '../lib/parsers/json';
import type { Source, SourceType, SourceStatus, PaginationMeta } from '@shared/types';
import { Request } from 'express';

export interface SourceWithStats {
  id: number;
  projectId: number;
  name: string;
  type: SourceType;
  status: SourceStatus;
  originalFilename: string | null;
  fileSize: number | null;
  rowCount: number | null;
  columnCount: number | null;
  columns: string[] | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceListResult {
  sources: SourceWithStats[];
  pagination: PaginationMeta;
}

export interface SourcePreviewResult {
  columns: string[];
  rows: Array<{
    rowIndex: number;
    data: Record<string, unknown>;
  }>;
  pagination: PaginationMeta;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function verifyProjectAccess(
  projectId: number,
  organizationId: number
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
}

export async function listSources(
  projectId: number,
  organizationId: number,
  options: { page?: number; limit?: number; search?: string } = {}
): Promise<SourceListResult> {
  await verifyProjectAccess(projectId, organizationId);

  const { page = 1, limit = 20, search } = options;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(sources.projectId, projectId),
    isNull(sources.deletedAt),
  ];

  if (search) {
    conditions.push(ilike(sources.name, `%${search}%`));
  }

  const totalResult = await db
    .select({ count: count() })
    .from(sources)
    .where(and(...conditions));

  const total = totalResult[0].count;

  const sourceList = await db.query.sources.findMany({
    where: and(...conditions),
    orderBy: [desc(sources.updatedAt)],
    limit,
    offset,
  });

  return {
    sources: sourceList.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      type: s.type,
      status: s.status,
      originalFilename: s.originalFilename,
      fileSize: s.fileSize,
      rowCount: s.rowCount,
      columnCount: s.columnCount,
      columns: s.columns,
      errorMessage: s.errorMessage,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function getSource(
  sourceId: number,
  organizationId: number
): Promise<SourceWithStats> {
  const source = await db.query.sources.findFirst({
    where: and(
      eq(sources.id, sourceId),
      isNull(sources.deletedAt)
    ),
    with: {
      project: true,
    },
  });

  if (!source || source.project.organizationId !== organizationId || source.project.deletedAt) {
    throw new NotFoundError('Source');
  }

  return {
    id: source.id,
    projectId: source.projectId,
    name: source.name,
    type: source.type,
    status: source.status,
    originalFilename: source.originalFilename,
    fileSize: source.fileSize,
    rowCount: source.rowCount,
    columnCount: source.columnCount,
    columns: source.columns,
    errorMessage: source.errorMessage,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

export async function createFileSource(
  projectId: number,
  organizationId: number,
  file: Express.Multer.File,
  name: string,
  userId: number,
  req?: Request
): Promise<SourceWithStats> {
  await verifyProjectAccess(projectId, organizationId);

  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Create source in uploading state
  const [source] = await db.insert(sources).values({
    projectId,
    name,
    type: 'file',
    status: 'uploading',
    originalFilename: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  }).returning();

  try {
    // Update to parsing
    await db.update(sources).set({ status: 'parsing' }).where(eq(sources.id, source.id));

    // Parse file based on type
    let parseResult: { columns: string[]; rows: Record<string, unknown>[] };
    const content = file.buffer.toString('utf-8');

    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      parseResult = parseCSV(content);
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      parseResult = parseExcel(file.buffer);
    } else if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      parseResult = parseJSON(content);
    } else if (file.originalname.endsWith('.jsonl')) {
      parseResult = parseJSONL(content);
    } else {
      throw new BadRequestError('Unsupported file type. Supported: CSV, Excel, JSON, JSONL');
    }

    // Store rows in source_data
    if (parseResult.rows.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < parseResult.rows.length; i += batchSize) {
        const batch = parseResult.rows.slice(i, i + batchSize);
        await db.insert(sourceData).values(
          batch.map((row, index) => ({
            sourceId: source.id,
            rowIndex: i + index,
            data: row,
          }))
        );
      }
    }

    // Update source to ready
    await db.update(sources).set({
      status: 'ready',
      rowCount: parseResult.rows.length,
      columnCount: parseResult.columns.length,
      columns: parseResult.columns,
      updatedAt: new Date(),
    }).where(eq(sources.id, source.id));

    // Create default configs
    await initializeSourceConfigs(source.id, parseResult.columns);

    await createAuditLog({
      organizationId,
      userId,
      projectId,
      sourceId: source.id,
      action: 'source_created',
      details: {
        name,
        type: 'file',
        filename: file.originalname,
        rowCount: parseResult.rows.length,
      },
      req,
    });

    return getSource(source.id, organizationId);
  } catch (error) {
    // Update source to error state
    await db.update(sources).set({
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown parsing error',
      updatedAt: new Date(),
    }).where(eq(sources.id, source.id));

    throw error;
  }
}

async function initializeSourceConfigs(sourceId: number, columns: string[]): Promise<void> {
  // Create empty field mapping
  await db.insert(fieldMappings).values({
    sourceId,
    mappings: [],
    customFields: [],
  });

  // Create default de-identification config
  await db.insert(deidentificationConfigs).values({
    sourceId,
    rules: [
      { id: 'default-email', type: 'email', replacement: '[EMAIL]', enabled: true, isDefault: true },
      { id: 'default-phone', type: 'phone', replacement: '[PHONE]', enabled: true, isDefault: true },
      { id: 'default-name', type: 'name', replacement: '[PERSON_N]', enabled: true, isDefault: true },
      { id: 'default-address', type: 'address', replacement: '[ADDRESS]', enabled: false, isDefault: true },
      { id: 'default-company', type: 'company', replacement: '[COMPANY]', enabled: false, isDefault: true },
    ],
    columnsToScan: columns,
  });

  // Create empty filter config
  await db.insert(filterConfigs).values({
    sourceId,
    filters: {},
  });
}

export async function updateSource(
  sourceId: number,
  organizationId: number,
  data: { name: string },
  userId: number,
  req?: Request
): Promise<SourceWithStats> {
  const source = await getSource(sourceId, organizationId);

  await db.update(sources).set({
    name: data.name,
    updatedAt: new Date(),
  }).where(eq(sources.id, sourceId));

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId,
    action: 'source_updated',
    details: { name: data.name },
    req,
  });

  return getSource(sourceId, organizationId);
}

export async function deleteSource(
  sourceId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<void> {
  const source = await getSource(sourceId, organizationId);

  // Check for active processing
  const activeRun = await db.query.processingRuns.findFirst({
    where: and(
      eq(processingRuns.sourceId, sourceId),
      eq(processingRuns.status, 'processing')
    ),
  });

  if (activeRun) {
    throw new ConflictError('Cannot delete source while processing is active');
  }

  // Soft delete
  await db.update(sources).set({
    deletedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(sources.id, sourceId));

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId,
    action: 'source_deleted',
    details: { name: source.name },
    req,
  });
}

export async function getSourcePreview(
  sourceId: number,
  organizationId: number,
  options: { page?: number; limit?: number; search?: string } = {}
): Promise<SourcePreviewResult> {
  const source = await getSource(sourceId, organizationId);

  if (source.status !== 'ready') {
    throw new BadRequestError('Source is not ready for preview');
  }

  const { page = 1, limit = 100, search } = options;
  const offset = (page - 1) * limit;

  const totalResult = await db
    .select({ count: count() })
    .from(sourceData)
    .where(eq(sourceData.sourceId, sourceId));

  const total = totalResult[0].count;

  const rows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
    orderBy: (sd, { asc }) => [asc(sd.rowIndex)],
    limit,
    offset,
  });

  return {
    columns: source.columns || [],
    rows: rows.map((r) => ({
      rowIndex: r.rowIndex,
      data: r.data,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function getSourceStats(
  sourceId: number,
  organizationId: number
): Promise<{
  totalRows: number;
  columnCount: number;
  fileSize: number | null;
  uploadDate: Date;
  columns: Array<{
    name: string;
    detectedType: string;
    nullCount: number;
    uniqueCount: number;
  }>;
}> {
  const source = await getSource(sourceId, organizationId);

  // Get sample data for analysis
  const sampleRows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
    limit: 1000,
  });

  const columns = (source.columns || []).map((colName) => {
    const values = sampleRows.map((r) => r.data[colName]);
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues.map((v) => String(v)));

    // Simple type detection
    let detectedType = 'string';
    if (nonNullValues.length > 0) {
      const sample = nonNullValues[0];
      if (typeof sample === 'number') {
        detectedType = 'number';
      } else if (typeof sample === 'boolean') {
        detectedType = 'boolean';
      } else if (typeof sample === 'string') {
        // Check if it looks like a date
        if (/^\d{4}-\d{2}-\d{2}/.test(sample)) {
          detectedType = 'date';
        } else if (/^[\w.-]+@[\w.-]+\.\w+$/.test(sample)) {
          detectedType = 'email';
        }
      }
    }

    return {
      name: colName,
      detectedType,
      nullCount: values.length - nonNullValues.length,
      uniqueCount: uniqueValues.size,
    };
  });

  return {
    totalRows: source.rowCount || 0,
    columnCount: source.columnCount || 0,
    fileSize: source.fileSize,
    uploadDate: source.createdAt,
    columns,
  };
}

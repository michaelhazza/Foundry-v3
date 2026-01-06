import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { outputs, processingRuns, sources, projects } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { NotFoundError } from '../errors';
import type { OutputFormat } from '@shared/types';
import { Request } from 'express';

export interface OutputResponse {
  id: number;
  processingRunId: number;
  filename: string;
  format: OutputFormat;
  fileSize: number;
  recordCount: number;
  createdAt: Date;
}

export async function listOutputs(
  sourceId: number,
  organizationId: number
): Promise<OutputResponse[]> {
  // Verify source access
  const source = await db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
    with: {
      project: true,
    },
  });

  if (!source || source.project.organizationId !== organizationId || source.deletedAt) {
    throw new NotFoundError('Source');
  }

  // Get all outputs for this source
  const results = await db.query.outputs.findMany({
    where: eq(outputs.processingRunId, processingRuns.id),
    with: {
      processingRun: true,
    },
    orderBy: [desc(outputs.createdAt)],
  });

  // Filter to only outputs for this source
  const sourceOutputs = await db
    .select({
      id: outputs.id,
      processingRunId: outputs.processingRunId,
      filename: outputs.filename,
      format: outputs.format,
      fileSize: outputs.fileSize,
      recordCount: outputs.recordCount,
      createdAt: outputs.createdAt,
    })
    .from(outputs)
    .innerJoin(processingRuns, eq(outputs.processingRunId, processingRuns.id))
    .where(eq(processingRuns.sourceId, sourceId))
    .orderBy(desc(outputs.createdAt));

  return sourceOutputs;
}

export async function getOutput(
  outputId: number,
  organizationId: number
): Promise<OutputResponse> {
  const output = await db.query.outputs.findFirst({
    where: eq(outputs.id, outputId),
    with: {
      processingRun: {
        with: {
          source: {
            with: {
              project: true,
            },
          },
        },
      },
    },
  });

  if (!output || output.processingRun.source.project.organizationId !== organizationId) {
    throw new NotFoundError('Output');
  }

  return {
    id: output.id,
    processingRunId: output.processingRunId,
    filename: output.filename,
    format: output.format,
    fileSize: output.fileSize,
    recordCount: output.recordCount,
    createdAt: output.createdAt,
  };
}

export async function previewOutput(
  outputId: number,
  organizationId: number,
  limit: number = 10
): Promise<{ preview: unknown[]; format: OutputFormat; recordCount: number }> {
  const output = await db.query.outputs.findFirst({
    where: eq(outputs.id, outputId),
    with: {
      processingRun: {
        with: {
          source: {
            with: {
              project: true,
            },
          },
        },
      },
    },
  });

  if (!output || output.processingRun.source.project.organizationId !== organizationId) {
    throw new NotFoundError('Output');
  }

  // Parse the file data (stored as base64 in text column)
  const content = Buffer.from(output.fileData, 'base64').toString('utf-8');
  let preview: unknown[] = [];

  if (output.format === 'raw_json') {
    const data = JSON.parse(content);
    preview = Array.isArray(data) ? data.slice(0, limit) : [data];
  } else {
    // JSONL format
    const lines = content.split('\n').filter((line) => line.trim());
    preview = lines.slice(0, limit).map((line) => JSON.parse(line));
  }

  return {
    preview,
    format: output.format,
    recordCount: output.recordCount,
  };
}

export async function downloadOutput(
  outputId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const output = await db.query.outputs.findFirst({
    where: eq(outputs.id, outputId),
    with: {
      processingRun: {
        with: {
          source: {
            with: {
              project: true,
            },
          },
        },
      },
    },
  });

  if (!output || output.processingRun.source.project.organizationId !== organizationId) {
    throw new NotFoundError('Output');
  }

  await createAuditLog({
    organizationId,
    userId,
    projectId: output.processingRun.source.project.id,
    sourceId: output.processingRun.sourceId,
    action: 'output_downloaded',
    details: {
      outputId: output.id,
      filename: output.filename,
    },
    req,
  });

  const mimeType = output.format === 'raw_json'
    ? 'application/json'
    : 'application/x-ndjson';

  return {
    buffer: Buffer.from(output.fileData, 'base64'),
    filename: output.filename,
    mimeType,
  };
}

export async function deleteOutput(
  outputId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<void> {
  const output = await db.query.outputs.findFirst({
    where: eq(outputs.id, outputId),
    with: {
      processingRun: {
        with: {
          source: {
            with: {
              project: true,
            },
          },
        },
      },
    },
  });

  if (!output || output.processingRun.source.project.organizationId !== organizationId) {
    throw new NotFoundError('Output');
  }

  await db.delete(outputs).where(eq(outputs.id, outputId));

  await createAuditLog({
    organizationId,
    userId,
    projectId: output.processingRun.source.project.id,
    sourceId: output.processingRun.sourceId,
    action: 'output_deleted',
    details: {
      outputId: output.id,
      filename: output.filename,
    },
    req,
  });
}

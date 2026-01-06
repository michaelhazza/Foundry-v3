import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { processingRuns, outputs, sourceData, fieldMappings, deidentificationConfigs, filterConfigs } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { getSource } from './source.service';
import { applyFilters } from './filter.service';
import { deidentifyRecord } from '../lib/pii/replacer';
import { NotFoundError, BadRequestError, ConflictError } from '../errors';
import type { ProcessingStatus, OutputFormat, MappingEntry, TransformationConfig } from '@shared/types';
import { Request } from 'express';

export interface ProcessingRunResponse {
  id: number;
  sourceId: number;
  status: ProcessingStatus;
  outputFormat: OutputFormat;
  processedCount: number;
  totalCount: number | null;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  startedBy: {
    id: number;
    name: string;
  };
}

export async function listProcessingRuns(
  sourceId: number,
  organizationId: number
): Promise<ProcessingRunResponse[]> {
  const source = await getSource(sourceId, organizationId);

  const runs = await db.query.processingRuns.findMany({
    where: eq(processingRuns.sourceId, sourceId),
    with: {
      startedBy: true,
    },
    orderBy: [desc(processingRuns.startedAt)],
  });

  return runs.map((run) => ({
    id: run.id,
    sourceId: run.sourceId,
    status: run.status,
    outputFormat: run.outputFormat,
    processedCount: run.processedCount || 0,
    totalCount: run.totalCount,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    startedBy: {
      id: run.startedBy.id,
      name: run.startedBy.name,
    },
  }));
}

export async function getProcessingRun(
  runId: number,
  organizationId: number
): Promise<ProcessingRunResponse> {
  const run = await db.query.processingRuns.findFirst({
    where: eq(processingRuns.id, runId),
    with: {
      startedBy: true,
      source: {
        with: {
          project: true,
        },
      },
    },
  });

  if (!run || run.source.project.organizationId !== organizationId) {
    throw new NotFoundError('Processing run');
  }

  return {
    id: run.id,
    sourceId: run.sourceId,
    status: run.status,
    outputFormat: run.outputFormat,
    processedCount: run.processedCount || 0,
    totalCount: run.totalCount,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    startedBy: {
      id: run.startedBy.id,
      name: run.startedBy.name,
    },
  };
}

export async function startProcessing(
  sourceId: number,
  organizationId: number,
  outputFormat: OutputFormat,
  userId: number,
  req?: Request
): Promise<ProcessingRunResponse> {
  const source = await getSource(sourceId, organizationId);

  if (source.status !== 'ready') {
    throw new BadRequestError('Source is not ready for processing');
  }

  // Check for active processing
  const activeRun = await db.query.processingRuns.findFirst({
    where: and(
      eq(processingRuns.sourceId, sourceId),
      eq(processingRuns.status, 'processing')
    ),
  });

  if (activeRun) {
    throw new ConflictError('Processing is already in progress');
  }

  // Get configurations
  const [mapping, deidentification, filters] = await Promise.all([
    db.query.fieldMappings.findFirst({ where: eq(fieldMappings.sourceId, sourceId) }),
    db.query.deidentificationConfigs.findFirst({ where: eq(deidentificationConfigs.sourceId, sourceId) }),
    db.query.filterConfigs.findFirst({ where: eq(filterConfigs.sourceId, sourceId) }),
  ]);

  // Create processing run
  const [run] = await db.insert(processingRuns).values({
    sourceId,
    startedById: userId,
    outputFormat,
    status: 'pending',
    configSnapshot: {
      mappings: mapping?.mappings || [],
      deidentification: {
        rules: deidentification?.rules || [],
        columnsToScan: deidentification?.columnsToScan || [],
      },
      filters: filters?.filters || {},
    },
  }).returning();

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId,
    action: 'processing_started',
    details: { runId: run.id, outputFormat },
    req,
  });

  // Start processing in background
  processSourceData(run.id, organizationId).catch((error) => {
    console.error('Processing error:', error);
  });

  const user = await db.query.users.findFirst({ where: eq(processingRuns.startedById, userId) });

  return {
    id: run.id,
    sourceId: run.sourceId,
    status: 'processing',
    outputFormat: run.outputFormat,
    processedCount: 0,
    totalCount: source.rowCount,
    errorMessage: null,
    startedAt: run.startedAt,
    completedAt: null,
    startedBy: {
      id: userId,
      name: user?.name || 'Unknown',
    },
  };
}

async function processSourceData(runId: number, organizationId: number): Promise<void> {
  try {
    // Update status to processing
    await db.update(processingRuns).set({ status: 'processing' }).where(eq(processingRuns.id, runId));

    const run = await db.query.processingRuns.findFirst({
      where: eq(processingRuns.id, runId),
      with: {
        source: {
          with: {
            project: true,
          },
        },
      },
    });

    if (!run) throw new Error('Processing run not found');

    const configSnapshot = run.configSnapshot as {
      mappings: MappingEntry[];
      deidentification: { rules: any[]; columnsToScan: string[] };
      filters: any;
    };

    // Get all source data
    const rows = await db.query.sourceData.findMany({
      where: eq(sourceData.sourceId, run.sourceId),
      orderBy: (sd, { asc }) => [asc(sd.rowIndex)],
    });

    // Update total count
    await db.update(processingRuns).set({ totalCount: rows.length }).where(eq(processingRuns.id, runId));

    // Apply filters
    let processedRows = applyFilters(
      rows.map((r) => ({ rowIndex: r.rowIndex, data: r.data })),
      configSnapshot.filters
    );

    // Apply mappings and de-identification
    const outputRecords: unknown[] = [];

    for (let i = 0; i < processedRows.length; i++) {
      const row = processedRows[i];

      // Apply mappings
      let mappedData: Record<string, unknown> = {};
      for (const mapping of configSnapshot.mappings) {
        let value = row.data[mapping.sourceColumn];

        // Apply transformations
        if (mapping.transformations) {
          for (const transform of mapping.transformations) {
            value = applyTransformation(value, transform);
          }
        }

        mappedData[mapping.targetField] = value;
      }

      // Apply de-identification
      if (configSnapshot.deidentification.rules.length > 0) {
        const result = deidentifyRecord(
          mappedData,
          Object.keys(mappedData), // Scan all mapped fields
          configSnapshot.deidentification.rules
        );
        mappedData = result.deidentified;
      }

      outputRecords.push(mappedData);

      // Update progress every 100 records
      if (i % 100 === 0) {
        await db.update(processingRuns).set({ processedCount: i + 1 }).where(eq(processingRuns.id, runId));
      }
    }

    // Format output based on format type
    let outputContent: string;
    let recordCount = outputRecords.length;

    switch (run.outputFormat) {
      case 'conversational_jsonl':
        outputContent = formatConversationalJSONL(outputRecords);
        break;
      case 'qa_pairs_jsonl':
        const qaPairs = extractQAPairs(outputRecords);
        outputContent = qaPairs.map((p) => JSON.stringify(p)).join('\n');
        recordCount = qaPairs.length;
        break;
      case 'raw_json':
        outputContent = JSON.stringify(outputRecords, null, 2);
        break;
      default:
        throw new Error(`Unknown output format: ${run.outputFormat}`);
    }

    const outputBuffer = Buffer.from(outputContent, 'utf-8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = run.outputFormat === 'raw_json' ? 'json' : 'jsonl';
    const filename = `output-${run.id}-${timestamp}.${extension}`;

    // Save output (store as base64 in text column)
    await db.insert(outputs).values({
      processingRunId: runId,
      filename,
      format: run.outputFormat,
      fileSize: outputBuffer.length,
      recordCount,
      fileData: outputBuffer.toString('base64'),
    });

    // Mark as completed
    await db.update(processingRuns).set({
      status: 'completed',
      processedCount: processedRows.length,
      completedAt: new Date(),
    }).where(eq(processingRuns.id, runId));

    await createAuditLog({
      organizationId,
      userId: run.startedById,
      projectId: run.source.project.id,
      sourceId: run.sourceId,
      action: 'processing_completed',
      details: {
        runId,
        recordCount,
        outputFormat: run.outputFormat,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await db.update(processingRuns).set({
      status: 'failed',
      errorMessage,
      completedAt: new Date(),
    }).where(eq(processingRuns.id, runId));

    const run = await db.query.processingRuns.findFirst({
      where: eq(processingRuns.id, runId),
      with: { source: { with: { project: true } } },
    });

    if (run) {
      await createAuditLog({
        organizationId,
        userId: run.startedById,
        projectId: run.source.project.id,
        sourceId: run.sourceId,
        action: 'processing_failed',
        details: { runId, error: errorMessage },
      });
    }
  }
}

function applyTransformation(value: unknown, transform: TransformationConfig): unknown {
  if (value === null || value === undefined) return value;

  switch (transform.type) {
    case 'lowercase':
      return String(value).toLowerCase();
    case 'uppercase':
      return String(value).toUpperCase();
    case 'trim':
      return String(value).trim();
    case 'value_map':
      const valueMap = transform.config?.valueMap as Record<string, string> | undefined;
      if (!valueMap) return value;
      return valueMap[String(value)] ?? value;
    default:
      return value;
  }
}

function formatConversationalJSONL(records: unknown[]): string {
  // Group by conversation_id if present
  const conversations = new Map<string, unknown[]>();

  for (const record of records) {
    const rec = record as Record<string, unknown>;
    const convId = String(rec.conversation_id || rec.id || Math.random());

    if (!conversations.has(convId)) {
      conversations.set(convId, []);
    }
    conversations.get(convId)!.push(rec);
  }

  // Format each conversation
  const lines: string[] = [];
  for (const [convId, messages] of conversations) {
    const conversation = {
      conversation_id: convId,
      messages: messages.map((m) => {
        const msg = m as Record<string, unknown>;
        const result: Record<string, unknown> = {
          role: msg.role || 'user',
          content: msg.content || '',
        };
        if (msg.timestamp) {
          result.timestamp = msg.timestamp;
        }
        return result;
      }),
    };
    lines.push(JSON.stringify(conversation));
  }

  return lines.join('\n');
}

function extractQAPairs(records: unknown[]): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];

  // Simple extraction: pair consecutive customer/agent messages
  for (let i = 0; i < records.length - 1; i++) {
    const current = records[i] as Record<string, unknown>;
    const next = records[i + 1] as Record<string, unknown>;

    const currentRole = String(current.role || '').toLowerCase();
    const nextRole = String(next.role || '').toLowerCase();

    if (
      (currentRole === 'customer' || currentRole === 'user') &&
      (nextRole === 'agent' || nextRole === 'assistant')
    ) {
      pairs.push({
        question: String(current.content || ''),
        answer: String(next.content || ''),
      });
    }
  }

  return pairs;
}

export async function cancelProcessing(
  runId: number,
  organizationId: number,
  userId: number,
  req?: Request
): Promise<void> {
  const run = await getProcessingRun(runId, organizationId);

  if (run.status !== 'processing' && run.status !== 'pending') {
    throw new BadRequestError('Cannot cancel a run that is not in progress');
  }

  await db.update(processingRuns).set({
    status: 'cancelled',
    completedAt: new Date(),
  }).where(eq(processingRuns.id, runId));

  const source = await getSource(run.sourceId, organizationId);

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId: run.sourceId,
    action: 'processing_cancelled',
    details: { runId },
    req,
  });
}

export async function previewOutput(
  sourceId: number,
  organizationId: number,
  format: OutputFormat,
  limit: number = 5
): Promise<{ preview: unknown[]; format: OutputFormat }> {
  const source = await getSource(sourceId, organizationId);

  const [mapping, deidentification, filters] = await Promise.all([
    db.query.fieldMappings.findFirst({ where: eq(fieldMappings.sourceId, sourceId) }),
    db.query.deidentificationConfigs.findFirst({ where: eq(deidentificationConfigs.sourceId, sourceId) }),
    db.query.filterConfigs.findFirst({ where: eq(filterConfigs.sourceId, sourceId) }),
  ]);

  // Get sample rows
  const rows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
    limit: limit * 2, // Get more to account for filtering
    orderBy: (sd, { asc }) => [asc(sd.rowIndex)],
  });

  // Apply filters
  let processedRows = applyFilters(
    rows.map((r) => ({ rowIndex: r.rowIndex, data: r.data })),
    filters?.filters || {}
  ).slice(0, limit);

  // Apply mappings and de-identification
  const outputRecords: unknown[] = [];

  for (const row of processedRows) {
    let mappedData: Record<string, unknown> = {};

    for (const m of mapping?.mappings || []) {
      let value = row.data[m.sourceColumn];
      if (m.transformations) {
        for (const t of m.transformations) {
          value = applyTransformation(value, t);
        }
      }
      mappedData[m.targetField] = value;
    }

    if (deidentification?.rules && deidentification.rules.length > 0) {
      const result = deidentifyRecord(
        mappedData,
        Object.keys(mappedData),
        deidentification.rules
      );
      mappedData = result.deidentified;
    }

    outputRecords.push(mappedData);
  }

  // Format based on type
  let preview: unknown[];
  switch (format) {
    case 'conversational_jsonl':
      preview = outputRecords.map((r) => ({
        conversation_id: (r as any).conversation_id || 'sample',
        messages: [{
          role: (r as any).role || 'user',
          content: (r as any).content || '',
        }],
      }));
      break;
    case 'qa_pairs_jsonl':
      preview = extractQAPairs(outputRecords).slice(0, limit);
      if (preview.length === 0) {
        preview = [{ question: 'Sample question', answer: 'Sample answer (no Q&A pairs found in sample)' }];
      }
      break;
    case 'raw_json':
      preview = outputRecords;
      break;
    default:
      preview = outputRecords;
  }

  return { preview, format };
}

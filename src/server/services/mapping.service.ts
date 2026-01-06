import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { fieldMappings, sourceData, sources } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { getSource } from './source.service';
import { NotFoundError, BadRequestError } from '../errors';
import type { MappingEntry, TransformationConfig } from '@shared/types';
import { STANDARD_TARGET_FIELDS } from '@shared/types';
import { Request } from 'express';

export interface MappingConfig {
  sourceId: number;
  mappings: MappingEntry[];
  customFields: string[];
  standardTargetFields: readonly string[];
  updatedAt: Date;
}

export interface MappingSuggestion {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  reason: string;
}

export async function getMapping(
  sourceId: number,
  organizationId: number
): Promise<MappingConfig> {
  const source = await getSource(sourceId, organizationId);

  const mapping = await db.query.fieldMappings.findFirst({
    where: eq(fieldMappings.sourceId, sourceId),
  });

  if (!mapping) {
    throw new NotFoundError('Mapping configuration');
  }

  return {
    sourceId: mapping.sourceId,
    mappings: mapping.mappings,
    customFields: mapping.customFields || [],
    standardTargetFields: STANDARD_TARGET_FIELDS,
    updatedAt: mapping.updatedAt,
  };
}

export async function updateMapping(
  sourceId: number,
  organizationId: number,
  data: { mappings: MappingEntry[]; customFields?: string[] },
  userId: number,
  req?: Request
): Promise<MappingConfig> {
  const source = await getSource(sourceId, organizationId);

  // Validate source columns exist
  const sourceColumns = source.columns || [];
  for (const mapping of data.mappings) {
    if (!sourceColumns.includes(mapping.sourceColumn)) {
      throw new BadRequestError(`Source column "${mapping.sourceColumn}" does not exist`);
    }
  }

  await db.update(fieldMappings).set({
    mappings: data.mappings,
    customFields: data.customFields || [],
    updatedAt: new Date(),
  }).where(eq(fieldMappings.sourceId, sourceId));

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId,
    action: 'mapping_updated',
    details: {
      mappingCount: data.mappings.length,
      customFields: data.customFields,
    },
    req,
  });

  return getMapping(sourceId, organizationId);
}

export async function getMappingSuggestions(
  sourceId: number,
  organizationId: number
): Promise<MappingSuggestion[]> {
  const source = await getSource(sourceId, organizationId);
  const sourceColumns = source.columns || [];

  const suggestions: MappingSuggestion[] = [];

  // Common mappings based on column name patterns
  const mappingPatterns: Array<{
    patterns: RegExp[];
    targetField: string;
    reason: string;
  }> = [
    {
      patterns: [/ticket[_-]?id/i, /conversation[_-]?id/i, /thread[_-]?id/i, /^id$/i],
      targetField: 'conversation_id',
      reason: 'Column name contains ID-like pattern',
    },
    {
      patterns: [/timestamp/i, /created[_-]?at/i, /date[_-]?time/i, /^date$/i],
      targetField: 'timestamp',
      reason: 'Column name suggests date/time',
    },
    {
      patterns: [/^role$/i, /sender[_-]?type/i, /author[_-]?type/i, /user[_-]?type/i],
      targetField: 'role',
      reason: 'Column name suggests user role',
    },
    {
      patterns: [/body/i, /content/i, /message/i, /text/i, /description/i],
      targetField: 'content',
      reason: 'Column name suggests message content',
    },
    {
      patterns: [/subject/i, /title/i, /summary/i],
      targetField: 'subject',
      reason: 'Column name suggests subject/title',
    },
    {
      patterns: [/^status$/i, /ticket[_-]?status/i, /state/i],
      targetField: 'status',
      reason: 'Column name suggests status',
    },
    {
      patterns: [/category/i, /type/i, /tag/i, /classification/i],
      targetField: 'category',
      reason: 'Column name suggests category',
    },
    {
      patterns: [/customer[_-]?email/i, /user[_-]?email/i, /email/i],
      targetField: 'customer_email',
      reason: 'Column name contains email',
    },
    {
      patterns: [/agent[_-]?name/i, /assignee/i, /handler/i],
      targetField: 'agent_name',
      reason: 'Column name suggests agent',
    },
  ];

  for (const column of sourceColumns) {
    for (const { patterns, targetField, reason } of mappingPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(column)) {
          // Check if suggestion already exists for this target field
          const existingSuggestion = suggestions.find((s) => s.targetField === targetField);
          if (!existingSuggestion) {
            // Calculate confidence based on pattern match specificity
            const confidence = pattern.toString().includes('^') ? 0.95 : 0.85;
            suggestions.push({
              sourceColumn: column,
              targetField,
              confidence,
              reason,
            });
          }
          break;
        }
      }
    }

    // Exact match check
    const normalizedColumn = column.toLowerCase().replace(/[_-]/g, '');
    for (const targetField of STANDARD_TARGET_FIELDS) {
      const normalizedTarget = targetField.toLowerCase().replace(/[_-]/g, '');
      if (normalizedColumn === normalizedTarget) {
        const existingSuggestion = suggestions.find((s) => s.targetField === targetField);
        if (!existingSuggestion) {
          suggestions.push({
            sourceColumn: column,
            targetField,
            confidence: 0.98,
            reason: 'Exact match',
          });
        }
      }
    }
  }

  // Sort by confidence descending
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

export async function previewMapping(
  sourceId: number,
  organizationId: number,
  limit: number = 10
): Promise<Array<{ original: Record<string, unknown>; mapped: Record<string, unknown> }>> {
  const source = await getSource(sourceId, organizationId);
  const mappingConfig = await getMapping(sourceId, organizationId);

  if (mappingConfig.mappings.length === 0) {
    throw new BadRequestError('No mappings configured');
  }

  // Get sample rows
  const rows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
    limit,
  });

  return rows.map((row) => {
    const original = row.data;
    const mapped: Record<string, unknown> = {};

    for (const mapping of mappingConfig.mappings) {
      let value = original[mapping.sourceColumn];

      // Apply transformations
      if (mapping.transformations) {
        for (const transform of mapping.transformations) {
          value = applyTransformation(value, transform);
        }
      }

      mapped[mapping.targetField] = value;
    }

    return { original, mapped };
  });
}

function applyTransformation(
  value: unknown,
  transform: TransformationConfig
): unknown {
  if (value === null || value === undefined) return value;

  switch (transform.type) {
    case 'lowercase':
      return String(value).toLowerCase();
    case 'uppercase':
      return String(value).toUpperCase();
    case 'trim':
      return String(value).trim();
    case 'date_format': {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return value;
      const format = (transform.config?.format as string) || 'YYYY-MM-DD';
      // Simple date formatting
      return date.toISOString().split('T')[0];
    }
    case 'value_map': {
      const valueMap = transform.config?.valueMap as Record<string, string> | undefined;
      if (!valueMap) return value;
      const stringValue = String(value);
      return valueMap[stringValue] ?? value;
    }
    default:
      return value;
  }
}

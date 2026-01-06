import { eq } from 'drizzle-orm';
import { db } from '../db';
import { filterConfigs, sourceData } from '@shared/schema';
import { createAuditLog } from './audit.service';
import { getSource } from './source.service';
import { NotFoundError, BadRequestError } from '../errors';
import type { FilterConfigData } from '@shared/types';
import { Request } from 'express';

export interface FilterConfigResponse {
  sourceId: number;
  filters: FilterConfigData;
  updatedAt: Date;
}

export interface FilterSummary {
  totalCount: number;
  filteredCount: number;
  excludedCount: number;
  filterBreakdown: {
    byRule: Record<string, number>;
    progressiveCounts: Array<{ rule: string; remaining: number }>;
  };
  warnings: Array<{ code: string; message: string }>;
}

export async function getFilterConfig(
  sourceId: number,
  organizationId: number
): Promise<FilterConfigResponse> {
  const source = await getSource(sourceId, organizationId);

  const config = await db.query.filterConfigs.findFirst({
    where: eq(filterConfigs.sourceId, sourceId),
  });

  if (!config) {
    throw new NotFoundError('Filter configuration');
  }

  return {
    sourceId: config.sourceId,
    filters: config.filters,
    updatedAt: config.updatedAt,
  };
}

export async function updateFilterConfig(
  sourceId: number,
  organizationId: number,
  filters: FilterConfigData,
  userId: number,
  req?: Request
): Promise<FilterConfigResponse> {
  const source = await getSource(sourceId, organizationId);

  // Validate date range
  if (filters.dateRange?.start && filters.dateRange?.end) {
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);
    if (end < start) {
      throw new BadRequestError('End date must be after start date');
    }
  }

  await db.update(filterConfigs).set({
    filters,
    updatedAt: new Date(),
  }).where(eq(filterConfigs.sourceId, sourceId));

  await createAuditLog({
    organizationId,
    userId,
    projectId: source.projectId,
    sourceId,
    action: 'filters_updated',
    details: { filters },
    req,
  });

  return getFilterConfig(sourceId, organizationId);
}

export async function getFilterSummary(
  sourceId: number,
  organizationId: number
): Promise<FilterSummary> {
  const source = await getSource(sourceId, organizationId);
  const config = await db.query.filterConfigs.findFirst({
    where: eq(filterConfigs.sourceId, sourceId),
  });

  if (!config) {
    throw new NotFoundError('Filter configuration');
  }

  // Get all source data
  const rows = await db.query.sourceData.findMany({
    where: eq(sourceData.sourceId, sourceId),
  });

  const totalCount = rows.length;
  const filters = config.filters;

  const byRule: Record<string, number> = {};
  const progressiveCounts: Array<{ rule: string; remaining: number }> = [];

  let remainingRows = rows;

  // Apply filters progressively and track exclusions
  // Filter: minConversationLength (simplified - would need conversation grouping in real implementation)
  if (filters.minConversationLength && filters.minConversationLength > 0) {
    const beforeCount = remainingRows.length;
    // This is simplified - in reality would group by conversation_id and count
    remainingRows = remainingRows.filter((row) => {
      // Check if there's a mapped conversation_id or similar field
      return true; // Simplified - pass all
    });
    byRule.minConversationLength = beforeCount - remainingRows.length;
    progressiveCounts.push({ rule: 'minConversationLength', remaining: remainingRows.length });
  }

  // Filter: minContentLength
  if (filters.minContentLength && filters.minContentLength > 0) {
    const beforeCount = remainingRows.length;
    remainingRows = remainingRows.filter((row) => {
      // Look for content-like fields
      const contentFields = ['content', 'body', 'message', 'text', 'description'];
      for (const field of contentFields) {
        const value = row.data[field];
        if (typeof value === 'string') {
          return value.length >= (filters.minContentLength || 0);
        }
      }
      return true; // Pass if no content field found
    });
    byRule.minContentLength = beforeCount - remainingRows.length;
    progressiveCounts.push({ rule: 'minContentLength', remaining: remainingRows.length });
  }

  // Filter: statusInclude
  if (filters.statusInclude && filters.statusInclude.length > 0) {
    const beforeCount = remainingRows.length;
    remainingRows = remainingRows.filter((row) => {
      const statusFields = ['status', 'state', 'ticket_status'];
      for (const field of statusFields) {
        const value = row.data[field];
        if (typeof value === 'string') {
          return filters.statusInclude!.includes(value.toLowerCase());
        }
      }
      return true;
    });
    byRule.status = beforeCount - remainingRows.length;
    progressiveCounts.push({ rule: 'status', remaining: remainingRows.length });
  }

  // Filter: statusExclude
  if (filters.statusExclude && filters.statusExclude.length > 0) {
    const beforeCount = remainingRows.length;
    remainingRows = remainingRows.filter((row) => {
      const statusFields = ['status', 'state', 'ticket_status'];
      for (const field of statusFields) {
        const value = row.data[field];
        if (typeof value === 'string') {
          return !filters.statusExclude!.includes(value.toLowerCase());
        }
      }
      return true;
    });
    byRule.statusExclude = beforeCount - remainingRows.length;
  }

  // Filter: dateRange
  if (filters.dateRange?.start || filters.dateRange?.end) {
    const beforeCount = remainingRows.length;
    const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
    const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

    remainingRows = remainingRows.filter((row) => {
      const dateFields = ['date', 'created_at', 'timestamp', 'created', 'datetime'];
      for (const field of dateFields) {
        const value = row.data[field];
        if (value) {
          const date = new Date(String(value));
          if (!isNaN(date.getTime())) {
            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
            return true;
          }
        }
      }
      return true;
    });
    byRule.dateRange = beforeCount - remainingRows.length;
    progressiveCounts.push({ rule: 'dateRange', remaining: remainingRows.length });
  }

  const filteredCount = remainingRows.length;
  const excludedCount = totalCount - filteredCount;

  // Generate warnings
  const warnings: Array<{ code: string; message: string }> = [];

  if (filteredCount === 0) {
    warnings.push({
      code: 'NO_RECORDS_MATCH',
      message: 'No records match current filter criteria.',
    });
  } else if (excludedCount / totalCount > 0.9) {
    warnings.push({
      code: 'HIGH_EXCLUSION_RATE',
      message: `Filters exclude ${Math.round((excludedCount / totalCount) * 100)}% of records. Consider adjusting criteria.`,
    });
  }

  return {
    totalCount,
    filteredCount,
    excludedCount,
    filterBreakdown: {
      byRule,
      progressiveCounts,
    },
    warnings,
  };
}

export function applyFilters(
  rows: Array<{ rowIndex: number; data: Record<string, unknown> }>,
  filters: FilterConfigData
): Array<{ rowIndex: number; data: Record<string, unknown> }> {
  let result = rows;

  // minContentLength
  if (filters.minContentLength && filters.minContentLength > 0) {
    result = result.filter((row) => {
      const contentFields = ['content', 'body', 'message', 'text', 'description'];
      for (const field of contentFields) {
        const value = row.data[field];
        if (typeof value === 'string') {
          return value.length >= (filters.minContentLength || 0);
        }
      }
      return true;
    });
  }

  // statusInclude
  if (filters.statusInclude && filters.statusInclude.length > 0) {
    result = result.filter((row) => {
      const statusFields = ['status', 'state', 'ticket_status'];
      for (const field of statusFields) {
        const value = row.data[field];
        if (typeof value === 'string') {
          return filters.statusInclude!.some((s) => s.toLowerCase() === value.toLowerCase());
        }
      }
      return true;
    });
  }

  // statusExclude
  if (filters.statusExclude && filters.statusExclude.length > 0) {
    result = result.filter((row) => {
      const statusFields = ['status', 'state', 'ticket_status'];
      for (const field of statusFields) {
        const value = row.data[field];
        if (typeof value === 'string') {
          return !filters.statusExclude!.some((s) => s.toLowerCase() === value.toLowerCase());
        }
      }
      return true;
    });
  }

  // dateRange
  if (filters.dateRange?.start || filters.dateRange?.end) {
    const startDate = filters.dateRange?.start ? new Date(filters.dateRange.start) : null;
    const endDate = filters.dateRange?.end ? new Date(filters.dateRange.end) : null;

    result = result.filter((row) => {
      const dateFields = ['date', 'created_at', 'timestamp', 'created', 'datetime'];
      for (const field of dateFields) {
        const value = row.data[field];
        if (value) {
          const date = new Date(String(value));
          if (!isNaN(date.getTime())) {
            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
          }
        }
      }
      return true;
    });
  }

  return result;
}

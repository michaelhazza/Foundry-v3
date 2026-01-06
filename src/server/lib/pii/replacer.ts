import type { DeidentificationRule, PiiScanSummary } from '@shared/types';
import { detectPii, detectCustomPattern, PiiMatch } from './detector';

export interface ReplacementResult {
  original: string;
  replaced: string;
  replacements: Array<{
    type: string;
    original: string;
    replacement: string;
    start: number;
    end: number;
  }>;
}

export function applyDeidentification(
  text: string,
  rules: DeidentificationRule[]
): ReplacementResult {
  if (!text || typeof text !== 'string') {
    return { original: text, replaced: text, replacements: [] };
  }

  const activeRules = rules.filter((r) => r.enabled);
  if (activeRules.length === 0) {
    return { original: text, replaced: text, replacements: [] };
  }

  const allMatches: Array<{
    type: string;
    value: string;
    start: number;
    end: number;
    replacement: string;
  }> = [];

  // Track name counters for unique replacements
  const nameCounter: Record<string, number> = {};

  for (const rule of activeRules) {
    if (rule.type === 'custom' && rule.pattern) {
      // Custom pattern
      try {
        const matches = detectCustomPattern(text, rule.pattern);
        for (const match of matches) {
          allMatches.push({
            type: 'custom',
            value: match.value,
            start: match.start,
            end: match.end,
            replacement: rule.replacement,
          });
        }
      } catch {
        // Skip invalid patterns
      }
    } else {
      // Built-in type detection
      const detection = detectPii(text);

      for (const match of detection.matches) {
        if (match.type === rule.type) {
          let replacement = rule.replacement;

          // Handle name replacement with counter
          if (match.type === 'name' && replacement.includes('_N')) {
            const nameLower = match.value.toLowerCase();
            if (!nameCounter[nameLower]) {
              nameCounter[nameLower] = Object.keys(nameCounter).length + 1;
            }
            replacement = replacement.replace('_N', `_${nameCounter[nameLower]}`);
          }

          allMatches.push({
            type: match.type,
            value: match.value,
            start: match.start,
            end: match.end,
            replacement,
          });
        }
      }
    }
  }

  // Sort by start position descending (to replace from end to start)
  allMatches.sort((a, b) => b.start - a.start);

  // Remove overlapping matches (keep the first/highest priority)
  const filteredMatches: typeof allMatches = [];
  for (const match of allMatches) {
    const overlaps = filteredMatches.some(
      (existing) => match.start < existing.end && match.end > existing.start
    );
    if (!overlaps) {
      filteredMatches.push(match);
    }
  }

  // Apply replacements from end to start
  let replaced = text;
  const replacements: ReplacementResult['replacements'] = [];

  for (const match of filteredMatches) {
    replaced = replaced.slice(0, match.start) + match.replacement + replaced.slice(match.end);
    replacements.push({
      type: match.type,
      original: match.value,
      replacement: match.replacement,
      start: match.start,
      end: match.end,
    });
  }

  // Reverse replacements to match original order
  replacements.reverse();

  return { original: text, replaced, replacements };
}

export function deidentifyRecord(
  record: Record<string, unknown>,
  columnsToScan: string[],
  rules: DeidentificationRule[]
): {
  original: Record<string, unknown>;
  deidentified: Record<string, unknown>;
  piiHighlights: Array<{ type: string; start: number; end: number; column: string }>;
} {
  const deidentified: Record<string, unknown> = { ...record };
  const piiHighlights: Array<{ type: string; start: number; end: number; column: string }> = [];

  for (const column of columnsToScan) {
    const value = record[column];
    if (value && typeof value === 'string') {
      const result = applyDeidentification(value, rules);
      deidentified[column] = result.replaced;

      for (const replacement of result.replacements) {
        piiHighlights.push({
          type: replacement.type,
          start: replacement.start,
          end: replacement.end,
          column,
        });
      }
    }
  }

  return { original: record, deidentified, piiHighlights };
}

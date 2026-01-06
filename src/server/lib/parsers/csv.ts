import Papa from 'papaparse';

export interface ParseResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export function parseCSV(content: string): ParseResult {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    const error = result.errors[0];
    throw new Error(`CSV parsing error at row ${error.row}: ${error.message}`);
  }

  const columns = result.meta.fields || [];
  const rows = result.data as Record<string, unknown>[];

  return {
    columns,
    rows,
    rowCount: rows.length,
  };
}

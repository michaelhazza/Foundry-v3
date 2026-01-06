export interface ParseResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export function parseJSON(content: string): ParseResult {
  let data: unknown;

  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON format');
  }

  // Handle array of objects
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error('JSON array is empty');
    }

    // Check if all items are objects
    if (!data.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
      throw new Error('JSON array must contain objects');
    }

    const rows = data as Record<string, unknown>[];

    // Get all unique keys from all objects
    const columnSet = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key));
    });

    const columns = Array.from(columnSet);

    return {
      columns,
      rows,
      rowCount: rows.length,
    };
  }

  // Handle single object with array property
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    // Look for an array property
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        if (value.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
          const rows = value as Record<string, unknown>[];

          const columnSet = new Set<string>();
          rows.forEach(row => {
            Object.keys(row).forEach(k => columnSet.add(k));
          });

          return {
            columns: Array.from(columnSet),
            rows,
            rowCount: rows.length,
          };
        }
      }
    }

    throw new Error('JSON object must contain an array of objects');
  }

  throw new Error('JSON must be an array of objects or an object containing an array');
}

export function parseJSONL(content: string): ParseResult {
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('JSONL file is empty');
  }

  const rows: Record<string, unknown>[] = [];
  const columnSet = new Set<string>();

  lines.forEach((line, index) => {
    try {
      const obj = JSON.parse(line);
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        throw new Error('Each line must be a JSON object');
      }
      Object.keys(obj).forEach(key => columnSet.add(key));
      rows.push(obj);
    } catch (error) {
      throw new Error(`Invalid JSON at line ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    columns: Array.from(columnSet),
    rows,
    rowCount: rows.length,
  };
}

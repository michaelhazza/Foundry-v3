import * as XLSX from 'xlsx';

export interface ParseResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file contains no sheets');
  }

  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][];

  if (jsonData.length === 0) {
    throw new Error('Excel sheet is empty');
  }

  // First row is headers
  const headers = jsonData[0] as string[];
  const columns = headers.map((h, i) =>
    h ? String(h).trim() : `Column_${i + 1}`
  );

  // Convert rows to objects
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < jsonData.length; i++) {
    const row: Record<string, unknown> = {};
    const values = jsonData[i];

    columns.forEach((col, index) => {
      row[col] = values[index] ?? null;
    });

    // Skip completely empty rows
    if (Object.values(row).some(v => v !== null)) {
      rows.push(row);
    }
  }

  return {
    columns,
    rows,
    rowCount: rows.length,
  };
}

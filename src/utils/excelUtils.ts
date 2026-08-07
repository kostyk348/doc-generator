// xlsx (SheetJS) импортируется динамически — ~860 КБ несжатого JS, нужен только
// при реальном импорте/экспорте Excel-файла, не при каждом открытии страницы.

export interface ExcelRowData {
  [key: string]: string | number | boolean;
}

/**
 * Parses an Excel or CSV file buffer into an array of JSON objects
 */
export const parseExcelOrCsv = async (binaryData: string | ArrayBuffer): Promise<Record<string, unknown>[]> => {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(binaryData, { type: 'binary' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const worksheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  } catch (err) {
    console.error('XLSX parsing failed, trying CSV fallback:', err);
    // Fallback CSV parsing if binary string
    if (typeof binaryData === 'string') {
      const lines = binaryData.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return [];
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows: Record<string, unknown>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, unknown> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }
      return rows;
    }
    throw err;
  }
};

/**
 * Exports data objects to an Excel (.xlsx) file
 */
export const exportToExcelFile = async (
  data: Record<string, unknown>[],
  filename: string,
  sheetName = 'Сотрудники'
) => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

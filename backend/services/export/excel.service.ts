import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface BuildWorkbookInput {
  sheetName: string;
  columns: ExcelColumn[];
  rows: Array<Record<string, unknown>>;
  title?: string;
}

/**
 * Builds an XLSX workbook from column defs + rows and returns a Buffer.
 * Export routes return this buffer with a Content-Disposition attachment header.
 */
export const buildWorkbook = async ({
  sheetName,
  columns,
  rows,
  title
}: BuildWorkbookInput): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Travel Agent Portal";
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || "Report");

  if (title) {
    sheet.addRow([title]);
    sheet.addRow([]);
  }

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? 20
  }));

  // When a title is present the header row is offset; re-add header explicitly.
  if (title) {
    sheet.getRow(3).values = columns.map((c) => c.header);
    sheet.getRow(3).font = { bold: true };
  } else {
    sheet.getRow(1).font = { bold: true };
  }

  rows.forEach((row) => sheet.addRow(row));

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};

export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

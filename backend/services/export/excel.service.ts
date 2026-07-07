import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/** A row value that renders as an embedded PNG image instead of text. */
export interface ExcelImageCell {
  image: Buffer;
  width?: number;
  height?: number;
}

const isImageCell = (value: unknown): value is ExcelImageCell =>
  typeof value === "object" && value !== null && Buffer.isBuffer((value as ExcelImageCell).image);

export interface BuildWorkbookInput {
  sheetName: string;
  columns: ExcelColumn[];
  rows: Array<Record<string, unknown>>;
  title?: string;
}

/**
 * Builds an XLSX workbook from column defs + rows and returns a Buffer.
 * Export routes return this buffer with a Content-Disposition attachment header.
 * A row value shaped as ExcelImageCell ({ image: Buffer }) is embedded as a
 * PNG in that cell (the row height grows to fit).
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

  rows.forEach((row) => {
    const values: Record<string, unknown> = {};
    const imageCells: Array<{ key: string; cell: ExcelImageCell }> = [];
    for (const [key, value] of Object.entries(row)) {
      if (isImageCell(value)) {
        imageCells.push({ key, cell: value });
        values[key] = "";
      } else {
        values[key] = value;
      }
    }

    const added = sheet.addRow(values);

    if (imageCells.length) {
      const maxHeightPx = Math.max(...imageCells.map(({ cell }) => cell.height ?? 80));
      added.height = maxHeightPx * 0.75; // px → points
      for (const { key, cell } of imageCells) {
        const colIndex = columns.findIndex((c) => c.key === key);
        if (colIndex === -1) continue;
        // exceljs's Buffer type predates Node's generic Buffer; runtime accepts a plain Buffer.
        const imageId = workbook.addImage({
          buffer: cell.image as unknown as ExcelJS.Buffer,
          extension: "png"
        });
        sheet.addImage(imageId, {
          tl: { col: colIndex + 0.1, row: added.number - 1 + 0.05 },
          ext: { width: cell.width ?? 80, height: cell.height ?? 80 },
          editAs: "oneCell"
        });
      }
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};

export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

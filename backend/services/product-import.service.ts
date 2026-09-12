import ExcelJS from "exceljs";
import { parseProductBatch } from "@shared/types/product-batch";

export async function readProductWorkbook(bytes: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("The workbook has no worksheet");
  if (sheet.rowCount > 201 || sheet.columnCount > 20) throw new Error("Use at most 200 product rows and 20 columns");
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, col) => { headers.set(cell.text.trim().toLowerCase(), col); });
  for (const name of ["name", "sku", "type", "price"]) {
    if (!headers.has(name)) throw new Error(`Missing Excel header: ${name}`);
  }
  const products: Record<string, unknown>[] = [];
  for (let index = 2; index <= sheet.rowCount; index++) {
    const row = sheet.getRow(index);
    if (!row.hasValues) continue;
    const read = (name: string) => {
      const column = headers.get(name);
      if (!column) return "";
      const cell = row.getCell(column);
      if (cell.type === ExcelJS.ValueType.Formula || cell.type === ExcelJS.ValueType.Error) {
        throw new Error(`Excel row ${index}: use plain values instead of formulas or errors`);
      }
      return cell.text.trim();
    };
    const schemePrice = read("scheme price");
    products.push({ name: read("name"), sku: read("sku"), type: read("type").toUpperCase(), price: Number(read("price")),
      ...(schemePrice ? { schemePrice: Number(schemePrice) } : {}) });
  }
  return parseProductBatch({ outletId: "import-preview", products }).products;
}

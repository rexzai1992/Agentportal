import { NextRequest } from "next/server";
import { readProductWorkbook } from "@backend/services/product-import.service";
import { fail, ok, withAuth } from "@/lib/api";

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) return fail("Choose an .xlsx workbook");
    if (file.size > 2 * 1024 * 1024) return fail("Workbook must be smaller than 2 MB");
    return ok({ products: await readProductWorkbook(await file.arrayBuffer()) });
  });
}

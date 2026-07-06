import { NextRequest, NextResponse } from "next/server";
import { uploadController } from "@backend/controllers/upload.controller";
import { fail, withAuth } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN", "AGENT", "STAFF", "FINANCE"], async () => {
    try {
      const file = await uploadController.getForDownload(id);
      const body = new Uint8Array(file.buffer);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": `inline; filename="${file.fileName}"`,
          "Cache-Control": "private, max-age=60"
        }
      });
    } catch {
      return fail("Document not found", 404);
    }
  });
}

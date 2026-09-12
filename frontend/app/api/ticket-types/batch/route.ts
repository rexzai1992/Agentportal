import { NextRequest } from "next/server";
import { createProductBatch } from "@backend/services/product-batch.service";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async (context) =>
    ok(await createProductBatch(await parseBody<unknown>(request), context.user.id), 201)
  );
}

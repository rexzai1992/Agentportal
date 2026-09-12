import { NextRequest } from "next/server";
import { reviewComplimentary } from "@backend/services/complimentary.service";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, ["FINANCE"], async (context) => {
    const { id } = await params;
    const body = await parseBody<{ decision: "APPROVED" | "REJECTED"; remarks?: string }>(request);
    return ok(await reviewComplimentary({ id, userId: context.user.id, decision: body.decision, remarks: body.remarks }));
  });
}

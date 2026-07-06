import { NextRequest } from "next/server";
import { registrationController } from "@backend/controllers/registration.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async () => {
    const data = await registrationController.detail(id);
    return ok(data);
  });
}

import { NextRequest } from "next/server";
import { PartyType } from "@prisma/client";
import { registrationController } from "@backend/controllers/registration.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const sp = request.nextUrl.searchParams;
    const partyType = sp.get("partyType") as PartyType | null;
    const status = sp.get("status") || undefined;
    const search = sp.get("search") || undefined;

    const data = await registrationController.list({
      partyType: partyType ?? undefined,
      status,
      search
    });
    return ok(data);
  });
}

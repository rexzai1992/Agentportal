import { NextRequest } from "next/server";
import { PartyType } from "@prisma/client";
import { accountController } from "@backend/controllers/account.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const sp = request.nextUrl.searchParams;
    const partyType = (sp.get("partyType") as PartyType | null) ?? "AGENT";
    const search = sp.get("search") || undefined;
    const data = await accountController.list({ partyType, search });
    return ok(data);
  });
}

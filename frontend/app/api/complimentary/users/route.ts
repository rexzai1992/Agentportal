import { NextRequest } from "next/server";
import { complimentaryController } from "@backend/controllers/renewal.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => ok(await complimentaryController.users()));
}

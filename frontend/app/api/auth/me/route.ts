import { NextRequest } from "next/server";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT", "STAFF", "FINANCE"], async (context) =>
    ok({ user: context.user })
  );
}

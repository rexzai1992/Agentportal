import { NextRequest } from "next/server";
import { prisma } from "@backend/services/db";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface CreateOutletBody {
  name: string;
  code: string;
  description?: string;
  address?: string;
}

const normalizeOutletCode = (code: string) =>
  code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT", "STAFF"], async () =>
    withErrorHandling(async () => {
      const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false";

      const outlets = await prisma.outlet.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: [{ active: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          address: true,
          active: true,
          createdAt: true
        }
      });

      return ok(outlets);
    })
  );
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () =>
    withErrorHandling(async () => {
      const body = await parseBody<CreateOutletBody>(request);
      const name = body.name?.trim();
      const code = normalizeOutletCode(body.code ?? "");
      const description = body.description?.trim() || null;
      const address = body.address?.trim() || null;

      if (!name || !code) {
        return fail("Outlet name and code are required", 400);
      }

      const existing = await prisma.outlet.findUnique({
        where: { code },
        select: { id: true }
      });

      if (existing) {
        return fail("Outlet code must be unique", 400);
      }

      const outlet = await prisma.outlet.create({
        data: {
          name,
          code,
          description,
          address,
          active: true
        }
      });

      return ok(outlet, 201);
    })
  );
}

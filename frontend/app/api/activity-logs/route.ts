import { NextRequest } from "next/server";
import { prisma } from "@backend/services/db";
import { ok, withAuth, withErrorHandling } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () =>
    withErrorHandling(async () => {
      const limit = Number(request.nextUrl.searchParams.get("limit") || "100");

      const logs = await prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 500)
      });

      const userIds = Array.from(new Set(logs.map((log) => log.userId)));
      const users = userIds.length
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, fullName: true, email: true, role: true }
          })
        : [];

      const userById = new Map(users.map((user) => [user.id, user]));

      const hydrated = logs.map((log) => ({
        ...log,
        user: userById.get(log.userId) ?? null
      }));

      return ok(hydrated);
    })
  );
}

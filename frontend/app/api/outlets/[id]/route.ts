import { NextRequest } from "next/server";
import { prisma } from "@backend/services/db";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface UpdateOutletBody {
  description?: string | null;
  address?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNo?: string | null;
  active?: boolean;
}

const normalizeText = (value: string | null | undefined) => value?.trim() || null;

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(request, ["ADMIN"], async () =>
    withErrorHandling(async () => {
      const { id } = await context.params;
      const body = await parseBody<UpdateOutletBody>(request);

      const existing = await prisma.outlet.findUnique({ where: { id }, select: { id: true } });
      if (!existing) {
        return fail("Outlet not found", 404);
      }

      const outlet = await prisma.outlet.update({
        where: { id },
        data: {
          ...(body.description !== undefined ? { description: normalizeText(body.description) } : {}),
          ...(body.address !== undefined ? { address: normalizeText(body.address) } : {}),
          ...(body.bankName !== undefined ? { bankName: normalizeText(body.bankName) } : {}),
          ...(body.bankAccountName !== undefined
            ? { bankAccountName: normalizeText(body.bankAccountName) }
            : {}),
          ...(body.bankAccountNo !== undefined ? { bankAccountNo: normalizeText(body.bankAccountNo) } : {}),
          ...(typeof body.active === "boolean" ? { active: body.active } : {})
        }
      });

      return ok(outlet);
    })
  );
}

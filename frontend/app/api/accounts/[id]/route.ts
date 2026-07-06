import { NextRequest } from "next/server";
import { AccountStatus } from "@prisma/client";
import { accountController } from "@backend/controllers/account.controller";
import { ok, parseBody, withAuth } from "@/lib/api";

interface UpdateBody {
  accountStatus?: AccountStatus;
  accountExpiry?: string | null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async () => {
    const data = await accountController.detail(id);
    return ok(data);
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<UpdateBody>(request);
    const data = await accountController.update(
      id,
      { accountStatus: body.accountStatus, accountExpiry: body.accountExpiry },
      context.user.id
    );
    return ok(data);
  });
}

import { NextRequest } from "next/server";
import { authController } from "@backend/controllers/auth.controller";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

interface ChangePasswordBody {
  newPassword?: string;
  confirmPassword?: string;
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT", "STAFF", "FINANCE"], async (context) => {
    const body = await parseBody<ChangePasswordBody>(request);

    if (!body.newPassword || !body.confirmPassword) {
      return fail("New password and confirmation are required", 400);
    }
    if (body.newPassword !== body.confirmPassword) {
      return fail("Passwords do not match", 400);
    }

    await authController.changePassword(context.user.id, body.newPassword);
    return ok({ message: "Password changed successfully" });
  });
}

import { NextRequest } from "next/server";
import { authController } from "@backend/controllers/auth.controller";
import { fail, ok, parseBody, withErrorHandling } from "@/lib/api";

interface ResetBody {
  username?: string;
  email?: string;
  token?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await parseBody<ResetBody>(request);

    // Forgot-password: username + email → temporary password emailed.
    if (body.username && body.email) {
      await authController.requestTemporaryPassword(body.username, body.email);
      return ok({
        message: "If the account exists, a temporary password has been sent to the email."
      });
    }

    if (body.token && body.password) {
      await authController.resetPassword(body.token, body.password);
      return ok({ message: "Password reset successful" });
    }

    return fail("Provide username+email, or token+password", 400);
  });
}

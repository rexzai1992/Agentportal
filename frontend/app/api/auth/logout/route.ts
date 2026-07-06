import { NextRequest } from "next/server";
import { authController } from "@backend/controllers/auth.controller";
import { getAuthContext } from "@backend/middleware/auth";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { ok } from "@/lib/api";

export async function POST(request: NextRequest) {
  let userId: string | null = null;

  try {
    const context = await getAuthContext(request);
    userId = context.user.id;
  } catch {
    userId = null;
  }

  if (userId) {
    try {
      await authController.logout(userId);
    } catch {
      // Ignore logout persistence errors and still clear cookies client-side.
    }
  }

  const response = ok({ success: true });
  clearAuthCookies(response);
  return response;
}

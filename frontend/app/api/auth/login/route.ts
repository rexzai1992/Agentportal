import { NextRequest } from "next/server";
import { authController } from "@backend/controllers/auth.controller";
import { setAuthCookies } from "@/lib/auth-cookies";
import { fail, ok, parseBody, withErrorHandling } from "@/lib/api";

interface LoginBody {
  identifier?: string;
  username?: string;
  email?: string;
  password: string;
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await parseBody<LoginBody>(request);
    const identifier = body.identifier || body.username || body.email;

    if (!identifier || !body.password) {
      return fail("Username and password are required", 400);
    }

    const session = await authController.login(identifier, body.password);
    const response = ok({ user: session.user });
    setAuthCookies(response, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken
    });

    return response;
  });
}

import { NextRequest, NextResponse } from "next/server";
import { AuthContext, getAuthContext, requireRoles } from "@backend/middleware/auth";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";

export type AppRole = "ADMIN" | "AGENT" | "STAFF" | "FINANCE";

export const ok = <T>(data: T, status = 200): NextResponse =>
  NextResponse.json({ data }, { status });

export const fail = (message: string, status = 400, details?: unknown): NextResponse =>
  NextResponse.json(
    {
      error: {
        message,
        details
      }
    },
    { status }
  );

const mapErrorToStatus = (error: unknown): number => {
  const message = error instanceof Error ? error.message : "Internal error";
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid email or password") || normalized.includes("invalid credential")) {
    return 401;
  }
  if (
    normalized === "unauthorized" ||
    normalized.includes("refresh token") ||
    normalized.includes("access token") ||
    normalized.includes("token expired") ||
    normalized.includes("invalid token") ||
    normalized.includes("jwt")
  ) {
    return 401;
  }
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message.includes("not found")) return 404;
  return 400;
};

export const parseBody = async <T>(request: NextRequest): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
};

export const withErrorHandling = async (callback: () => Promise<NextResponse>) => {
  try {
    return await callback();
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return fail(message, status);
  }
};

export const withAuth = async (
  request: NextRequest,
  roles: AppRole[],
  callback: (context: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> => {
  try {
    const context = await getAuthContext(request);
    requireRoles(context, roles);

    const response = await callback(context);

    if (context.refreshedTokens) {
      setAuthCookies(response, context.refreshedTokens);
    }

    return response;
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message = error instanceof Error ? error.message : "Unauthorized";
    const response = fail(status === 401 ? "Unauthorized" : message, status);
    if (status === 401) {
      clearAuthCookies(response);
    }
    return response;
  }
};

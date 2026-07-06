import { NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@backend/services/constants";
import { refreshUserSession } from "@backend/services/auth.service";
import {
  verifyAccessToken,
  AppRole,
  PartyType,
  AccountStatus
} from "@backend/services/token.service";

export interface AuthContext {
  user: {
    id: string;
    role: AppRole;
    fullName: string;
    email: string;
    username?: string | null;
    agentId?: string | null;
    partyType?: PartyType | null;
    accountStatus?: AccountStatus | null;
    accountExpiry?: string | null;
  };
  refreshedTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export const getAuthContext = async (request: NextRequest): Promise<AuthContext> => {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      return {
        user: {
          id: payload.sub,
          role: payload.role,
          fullName: payload.fullName,
          email: payload.email,
          username: payload.username,
          agentId: payload.agentId,
          partyType: payload.partyType,
          accountStatus: payload.accountStatus,
          accountExpiry: payload.accountExpiry
        }
      };
    } catch {
      // Access token expired or invalid; fallback to refresh.
    }
  }

  if (!refreshToken) {
    throw new Error("Unauthorized");
  }

  let refreshed: Awaited<ReturnType<typeof refreshUserSession>>;
  try {
    refreshed = await refreshUserSession(refreshToken);
  } catch {
    throw new Error("Unauthorized");
  }

  return {
    user: refreshed.user,
    refreshedTokens: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken
    }
  };
};

export const requireRoles = (context: AuthContext, roles: AppRole[]): void => {
  if (!roles.includes(context.user.role)) {
    throw new Error("Forbidden");
  }
};

/**
 * Guards agent/partner-only actions that require an active (non-expired) account.
 * Login and profile/renewal remain reachable when expired; purchasing does not.
 */
export const requireActiveAgent = (context: AuthContext): void => {
  if (context.user.role !== "AGENT") {
    return;
  }
  if (context.user.accountStatus === "EXPIRED") {
    throw new Error("Account expired");
  }
};

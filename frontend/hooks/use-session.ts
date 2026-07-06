"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/fetcher";

type SessionRole = "ADMIN" | "AGENT" | "STAFF" | "FINANCE";

interface SessionResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    username?: string | null;
    role: SessionRole;
    agentId?: string | null;
    partyType?: "AGENT" | "PARTNER" | null;
    accountStatus?: "ACTIVE" | "INACTIVE" | "EXPIRED" | null;
    accountExpiry?: string | null;
    mustChangePassword?: boolean;
  };
}

const SESSION_CACHE_TTL_MS = 60_000;

let sessionCache: SessionResponse | null = null;
let sessionCacheUpdatedAt = 0;
let inFlightSessionRequest: Promise<SessionResponse> | null = null;

const getSessionCacheAgeMs = (): number | null => {
  if (!sessionCache || !sessionCacheUpdatedAt) return null;
  return Date.now() - sessionCacheUpdatedAt;
};

const getCachedSession = (): SessionResponse | null => {
  if (!sessionCache) return null;
  if (Date.now() - sessionCacheUpdatedAt > SESSION_CACHE_TTL_MS) return null;
  return sessionCache;
};

const setCachedSession = (value: SessionResponse | null) => {
  sessionCache = value;
  sessionCacheUpdatedAt = value ? Date.now() : 0;
};

export const clearSessionCache = () => {
  setCachedSession(null);
  inFlightSessionRequest = null;
};

const fetchSession = async (): Promise<SessionResponse> => {
  if (inFlightSessionRequest) {
    return inFlightSessionRequest;
  }

  inFlightSessionRequest = apiFetch<SessionResponse>("/api/auth/me")
    .then((result) => {
      setCachedSession(result);
      return result;
    })
    .finally(() => {
      inFlightSessionRequest = null;
    });

  return inFlightSessionRequest;
};

export const useSession = (allowedRoles?: SessionRole[]) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const rolesKey = useMemo(() => (allowedRoles ? allowedRoles.join("|") : ""), [allowedRoles]);
  const allowedRoleSet = useMemo(
    () => new Set((rolesKey ? rolesKey.split("|") : []) as SessionRole[]),
    [rolesKey]
  );

  useEffect(() => {
    let mounted = true;

    const redirectByRole = (role: SessionRole) => {
      if (role === "AGENT") router.replace("/agent/dashboard");
      else if (role === "ADMIN") router.replace("/admin/dashboard");
      else if (role === "FINANCE") router.replace("/finance/offline-payments");
      else router.replace("/scanner");
    };

    const applySession = (data: SessionResponse) => {
      if (allowedRoleSet.size > 0 && !allowedRoleSet.has(data.user.role)) {
        redirectByRole(data.user.role);
        return false;
      }

      setSession(data);
      setError(null);
      return true;
    };

    const cached = getCachedSession();
    const cacheAgeMs = cached ? getSessionCacheAgeMs() : null;
    if (cached) {
      applySession(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const run = async () => {
      try {
        const data = await fetchSession();

        if (!mounted) return;

        applySession(data);
      } catch (err) {
        if (!mounted) return;
        clearSessionCache();
        setError(err instanceof Error ? err.message : "Unauthorized");
        setSession(null);

        if (pathname !== "/login" && pathname !== "/forgot-password") {
          router.replace("/login");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!cached) {
      run();
      return () => {
        mounted = false;
      };
    }

    const shouldRefreshInBackground =
      cacheAgeMs !== null && cacheAgeMs >= Math.floor(SESSION_CACHE_TTL_MS * 0.75);

    if (shouldRefreshInBackground) {
      run();
    }

    return () => {
      mounted = false;
    };
  }, [allowedRoleSet, pathname, router]);

  return {
    loading,
    session,
    error,
    user: session?.user
  };
};

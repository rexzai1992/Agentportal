import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { logActivity } from "@backend/services/activity.service";
import {
  hashOpaqueToken,
  SessionTokenPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  AppRole,
  PartyType,
  AccountStatus
} from "@backend/services/token.service";
import { prisma } from "@backend/services/db";

interface SessionUser {
  id: string;
  role: AppRole;
  fullName: string;
  email: string;
  username: string | null;
  agentId: string | null;
  agent?: {
    partyType: PartyType;
    accountStatus: AccountStatus;
    accountExpiry: Date | null;
  } | null;
}

const deriveAccountStatus = (agent: SessionUser["agent"]): AccountStatus | null => {
  if (!agent) return null;
  if (agent.accountExpiry && agent.accountExpiry.getTime() < Date.now()) {
    return "EXPIRED";
  }
  return agent.accountStatus;
};

const buildPayload = (user: SessionUser): SessionTokenPayload => ({
  sub: user.id,
  role: user.role,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  agentId: user.agentId,
  partyType: user.agent?.partyType ?? null,
  accountStatus: deriveAccountStatus(user.agent),
  accountExpiry: user.agent?.accountExpiry ? user.agent.accountExpiry.toISOString() : null
});

const buildSessionUser = (user: SessionUser) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  role: user.role,
  agentId: user.agentId,
  partyType: user.agent?.partyType ?? null,
  accountStatus: deriveAccountStatus(user.agent),
  accountExpiry: user.agent?.accountExpiry ? user.agent.accountExpiry.toISOString() : null
});

const SESSION_USER_SELECT = {
  id: true,
  role: true,
  fullName: true,
  email: true,
  username: true,
  agentId: true,
  agent: {
    select: {
      partyType: true,
      accountStatus: true,
      accountExpiry: true
    }
  }
} as const;

interface RefreshedSession {
  user: ReturnType<typeof buildSessionUser>;
  accessToken: string;
  refreshToken: string;
}

const REFRESH_REPLAY_GRACE_MS = 15_000;
const inFlightRefreshByToken = new Map<string, Promise<RefreshedSession>>();
const refreshReplayByOldToken = new Map<
  string,
  { session: RefreshedSession; expiresAt: number }
>();

const pruneRefreshReplayCache = () => {
  const now = Date.now();
  for (const [token, entry] of refreshReplayByOldToken.entries()) {
    if (entry.expiresAt <= now) {
      refreshReplayByOldToken.delete(token);
    }
  }
};

const getRefreshReplaySession = (refreshToken: string): RefreshedSession | null => {
  pruneRefreshReplayCache();
  const entry = refreshReplayByOldToken.get(refreshToken);
  if (!entry) {
    return null;
  }
  return entry.session;
};

const setRefreshReplaySession = (refreshToken: string, session: RefreshedSession) => {
  refreshReplayByOldToken.set(refreshToken, {
    session,
    expiresAt: Date.now() + REFRESH_REPLAY_GRACE_MS
  });
};

/**
 * Login by username (system-generated account code, e.g. A2026xxxxx / P2026xxxxx)
 * OR by email. Admin/staff/finance are seeded with an email; agents/partners get a username.
 */
export const loginUser = async (identifier: string, password: string) => {
  const normalized = identifier.trim();
  const normalizedLower = normalized.toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: normalized }, { email: normalizedLower }]
    },
    select: {
      ...SESSION_USER_SELECT,
      passwordHash: true,
      passwordExpiresAt: true,
      mustChangePassword: true
    }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new Error("Invalid email or password");
  }

  if (
    user.mustChangePassword &&
    user.passwordExpiresAt &&
    user.passwordExpiresAt.getTime() < Date.now()
  ) {
    throw new Error("Temporary password expired. Please request a new password.");
  }

  const payload = buildPayload(user);
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload)
  ]);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: hashOpaqueToken(refreshToken)
    }
  });

  await logActivity({
    userId: user.id,
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    description: `${user.fullName} logged in`
  });

  return {
    user: {
      ...buildSessionUser(user),
      mustChangePassword: user.mustChangePassword
    },
    accessToken,
    refreshToken
  };
};

export const refreshUserSession = async (refreshToken: string) => {
  const replay = getRefreshReplaySession(refreshToken);
  if (replay) {
    return replay;
  }

  const inFlight = inFlightRefreshByToken.get(refreshToken);
  if (inFlight) {
    return inFlight;
  }

  const refreshPromise = (async (): Promise<RefreshedSession> => {
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload.sub) {
      throw new Error("Invalid refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        ...SESSION_USER_SELECT,
        refreshTokenHash: true
      }
    });

    if (!user || !user.refreshTokenHash) {
      throw new Error("Refresh token expired");
    }

    const matches = user.refreshTokenHash === hashOpaqueToken(refreshToken);
    if (!matches) {
      const replaySession = getRefreshReplaySession(refreshToken);
      if (replaySession) {
        return replaySession;
      }
      throw new Error("Refresh token mismatch");
    }

    const nextPayload = buildPayload(user);
    const [nextAccessToken, nextRefreshToken] = await Promise.all([
      signAccessToken(nextPayload),
      signRefreshToken(nextPayload)
    ]);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: hashOpaqueToken(nextRefreshToken)
      }
    });

    const nextSession: RefreshedSession = {
      user: buildSessionUser(user),
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    };

    // Short grace window so parallel requests using the pre-rotation cookie can recover.
    setRefreshReplaySession(refreshToken, nextSession);
    return nextSession;
  })().finally(() => {
    inFlightRefreshByToken.delete(refreshToken);
  });

  inFlightRefreshByToken.set(refreshToken, refreshPromise);
  return refreshPromise;
};

export const logoutUser = async (userId: string): Promise<void> => {
  await prisma.user.updateMany({
    where: { id: userId },
    data: { refreshTokenHash: null }
  });

  await logActivity({
    userId,
    action: "LOGOUT",
    entityType: "USER",
    entityId: userId,
    description: "User logged out"
  });
};

export const requestPasswordReset = async (email: string): Promise<string | null> => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, fullName: true }
  });

  if (!user) {
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry
    }
  });

  await logActivity({
    userId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "USER",
    entityId: user.id,
    description: "Password reset token generated"
  });

  return token;
};

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 5, message: "at least 5 characters" },
  { test: (v: string) => /[a-z]/.test(v), message: "one lowercase letter" },
  { test: (v: string) => /[A-Z]/.test(v), message: "one uppercase letter" },
  { test: (v: string) => /[0-9]/.test(v), message: "one number" },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), message: "one special character" }
];

export const assertPasswordComplexity = (password: string): void => {
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((r) => r.message);
  if (failed.length > 0) {
    throw new Error(`Password must contain ${failed.join(", ")}`);
  }
};

/** Generates a random temporary password that satisfies complexity rules. */
export const generateTemporaryPassword = (): string => {
  const digits = crypto.randomInt(100000, 999999).toString();
  return `Owg#${digits}`;
};

export const changePassword = async (userId: string, newPassword: string): Promise<void> => {
  assertPasswordComplexity(newPassword);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordExpiresAt: null,
      refreshTokenHash: null
    }
  });

  await logActivity({
    userId,
    action: "PASSWORD_CHANGED",
    entityType: "USER",
    entityId: userId,
    description: "User changed password"
  });
};

/**
 * Sets a temporary password for a user and returns it (caller emails it).
 * Used both by admin approval and the forgot-password flow.
 */
export const setTemporaryPassword = async (
  userId: string
): Promise<{ temporaryPassword: string; expiresAt: Date }> => {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: true,
      passwordExpiresAt: expiresAt,
      refreshTokenHash: null,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  return { temporaryPassword, expiresAt };
};

/**
 * Forgot-password flow (username + email): emails a temporary password.
 * Silent no-op when the account is not found (avoids user enumeration).
 */
export const requestTemporaryPassword = async (
  identifier: string,
  email: string
): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedId = identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      OR: [{ username: normalizedId }, { email: normalizedEmail }]
    },
    select: { id: true, email: true }
  });

  if (!user) {
    return;
  }

  const { emails } = await import("@backend/services/email/email.service");
  const { temporaryPassword } = await setTemporaryPassword(user.id);
  await emails.temporaryPassword(user.email, temporaryPassword);

  await logActivity({
    userId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "USER",
    entityId: user.id,
    description: "Temporary password issued"
  });
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() }
    },
    select: { id: true }
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      refreshTokenHash: null
    }
  });

  await logActivity({
    userId: user.id,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "USER",
    entityId: user.id,
    description: "Password reset completed"
  });
};

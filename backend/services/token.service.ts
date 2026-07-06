import crypto from "node:crypto";
import { JWTPayload, jwtVerify, SignJWT } from "jose";

const getSecret = (name: string): Uint8Array => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }

  return new TextEncoder().encode(value);
};

const parseExpiry = (value: string | undefined, fallback: string): string => value || fallback;

export type AppRole = "ADMIN" | "AGENT" | "STAFF" | "FINANCE";
export type PartyType = "AGENT" | "PARTNER";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export interface SessionTokenPayload extends JWTPayload {
  sub: string;
  role: AppRole;
  fullName: string;
  email: string;
  username?: string | null;
  agentId?: string | null;
  partyType?: PartyType | null;
  accountStatus?: AccountStatus | null;
  accountExpiry?: string | null;
}

export const signAccessToken = async (payload: SessionTokenPayload): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(parseExpiry(process.env.JWT_ACCESS_EXPIRES_IN, "15m"))
    .sign(getSecret("JWT_ACCESS_SECRET"));

export const signRefreshToken = async (payload: SessionTokenPayload): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN, "7d"))
    .sign(getSecret("JWT_REFRESH_SECRET"));

export const verifyAccessToken = async (token: string): Promise<SessionTokenPayload> => {
  const { payload } = await jwtVerify(token, getSecret("JWT_ACCESS_SECRET"));
  return payload as SessionTokenPayload;
};

export const verifyRefreshToken = async (token: string): Promise<SessionTokenPayload> => {
  const { payload } = await jwtVerify(token, getSecret("JWT_REFRESH_SECRET"));
  return payload as SessionTokenPayload;
};

export const hashOpaqueToken = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

export const signQrPayload = ({
  ticketId,
  qrToken,
  ts
}: {
  ticketId: string;
  qrToken: string;
  ts: number;
}): string => {
  const secret = process.env.JWT_ACCESS_SECRET || "travel-agent-default-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${ticketId}.${qrToken}.${ts}`)
    .digest("hex");
};

export const verifyQrPayloadSignature = ({
  ticketId,
  qrToken,
  ts,
  signature
}: {
  ticketId: string;
  qrToken: string;
  ts: number;
  signature: string;
}): boolean => {
  const expected = signQrPayload({ ticketId, qrToken, ts });
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

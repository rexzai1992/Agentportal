import { prisma } from "@backend/services/db";
import { OtaApiLogView, OTAProviderName } from "@shared/types/klook";

const SECRET_MASK = "********";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const maskSecret = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  if (value.length <= 8) {
    return SECRET_MASK;
  }

  return `${value.slice(0, 4)}${SECRET_MASK}${value.slice(-4)}`;
};

export const sanitizeHeadersForStorage = (headers: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    sanitized[key] = key.toLowerCase() === "authorization" ? `Bearer ${SECRET_MASK}` : value;
  }

  return sanitized;
};

export const sanitizeJsonForStorage = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonForStorage(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("apikey") || lowerKey.includes("api_key") || lowerKey.includes("authorization")) {
      sanitized[key] = typeof item === "string" ? maskSecret(item) : SECRET_MASK;
      continue;
    }
    sanitized[key] = sanitizeJsonForStorage(item);
  }

  return sanitized;
};

export const logOtaApiTransaction = async (input: {
  otaProvider: OTAProviderName;
  action: string;
  endpoint: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  success: boolean;
  errorMessage?: string;
}): Promise<void> => {
  const requestBodyJson = sanitizeJsonForStorage(input.requestBody);
  const responseBodyJson = sanitizeJsonForStorage(input.responseBody);

  await prisma.oTAApiLog.create({
    data: {
      id: crypto.randomUUID(),
      otaProvider: input.otaProvider as any,
      action: input.action,
      endpoint: input.endpoint,
      method: input.method,
      requestHeadersJson: sanitizeHeadersForStorage(input.requestHeaders),
      requestBodyJson: requestBodyJson == null ? undefined : (requestBodyJson as any),
      responseStatus: input.responseStatus ?? null,
      responseBodyJson: responseBodyJson == null ? undefined : (responseBodyJson as any),
      success: input.success,
      errorMessage: input.errorMessage ?? null
    }
  });
};

export const listOtaApiLogs = async (provider: OTAProviderName, limit = 25): Promise<OtaApiLogView[]> => {
  const rows = await prisma.oTAApiLog.findMany({
    select: {
      id: true,
      otaProvider: true,
      action: true,
      endpoint: true,
      method: true,
      responseStatus: true,
      success: true,
      errorMessage: true,
      createdAt: true
    },
    where: { otaProvider: provider as any },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100)
  });

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString()
  })) as OtaApiLogView[];
};

import { logOtaApiTransaction } from "@backend/services/ota/log.service";
import { resolveKlookRuntimeConfig } from "@backend/services/ota/providers/klook/klookConfigService";

export const DEFAULT_KLOOK_CAPABILITIES = ["octo/pricing"] as const;

interface KlookRequestOptions {
  action: string;
  path: string;
  method: "GET" | "POST";
  body?: unknown;
  searchParams?: Record<string, string | undefined | null>;
  capabilities?: string[];
  timeoutMs?: number;
}

const buildKlookUrl = (baseUrl: string, path: string, searchParams?: KlookRequestOptions["searchParams"]): string => {
  const normalizedBaseUrl = `${baseUrl.replace(/\/+$/, "")}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(normalizedPath, normalizedBaseUrl);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
};

const buildErrorMessage = (status: number, responseBody: unknown, fallback: string) => {
  if (responseBody && typeof responseBody === "object") {
    const body = responseBody as Record<string, unknown>;
    const message =
      (typeof body.errorMessage === "string" && body.errorMessage) ||
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message);

    if (message) {
      return message;
    }
  }

  return `${fallback} (${status})`;
};

export const klookRequest = async <T>(options: KlookRequestOptions): Promise<T> => {
  const config = await resolveKlookRuntimeConfig();
  const url = buildKlookUrl(config.apiBaseUrl, options.path, options.searchParams);
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${config.apiKey}`
  };

  if (options.method === "POST") {
    headers["Content-Type"] = "application/json";
  }

  if (options.capabilities?.length) {
    headers["Octo-Capabilities"] = options.capabilities.join(", ");
  }

  const requestInit: RequestInit = {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(options.timeoutMs ?? 20_000)
  };

  let responseStatus: number | undefined;
  let responseBody: unknown = null;

  try {
    const response = await fetch(url, requestInit);
    responseStatus = response.status;
    const contentType = response.headers.get("content-type") ?? "";
    responseBody = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = buildErrorMessage(response.status, responseBody, "Klook request failed");
      await logOtaApiTransaction({
        otaProvider: "KLOOK",
        action: options.action,
        endpoint: url,
        method: options.method,
        requestHeaders: headers,
        requestBody: options.body,
        responseStatus,
        responseBody,
        success: false,
        errorMessage
      });
      throw new Error(errorMessage);
    }

    await logOtaApiTransaction({
      otaProvider: "KLOOK",
      action: options.action,
      endpoint: url,
      method: options.method,
      requestHeaders: headers,
      requestBody: options.body,
      responseStatus,
      responseBody,
      success: true
    });

    return responseBody as T;
  } catch (error) {
    if (error instanceof Error && !responseStatus) {
      await logOtaApiTransaction({
        otaProvider: "KLOOK",
        action: options.action,
        endpoint: url,
        method: options.method,
        requestHeaders: headers,
        requestBody: options.body,
        responseStatus,
        responseBody,
        success: false,
        errorMessage: error.message
      });
    }

    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Klook API timeout");
    }

    throw error;
  }
};

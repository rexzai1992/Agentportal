import crypto from "node:crypto";
import { logActivity } from "@backend/services/activity.service";
import { prisma } from "@backend/services/db";
import { KlookSettingsUpdateInput, KlookSettingsView } from "@shared/types/klook";
import { KlookRuntimeConfig } from "@backend/services/ota/providers/klook/klookTypes";
import { maskSecret } from "@backend/services/ota/log.service";

interface StoredSettingRow {
  id: string;
  provider: "KLOOK";
  apiBaseUrl: string | null;
  clientId: string | null;
  apiKey: string | null;
  environment: "SANDBOX" | "PRODUCTION";
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const readEnvOverrides = () => {
  const apiBaseUrl = process.env.KLOOK_API_BASE_URL?.trim() ?? "";
  const clientId = process.env.KLOOK_CLIENT_ID?.trim() ?? "";
  const apiKey = process.env.KLOOK_API_KEY?.trim() ?? "";
  const environmentValue = process.env.KLOOK_ENVIRONMENT?.trim().toUpperCase();
  const enabledValue = process.env.KLOOK_ENABLED?.trim().toLowerCase();

  return {
    apiBaseUrl,
    clientId,
    apiKey,
    environment:
      environmentValue === "PRODUCTION" || environmentValue === "SANDBOX"
        ? (environmentValue as "SANDBOX" | "PRODUCTION")
        : null,
    isEnabled:
      enabledValue === "true" ? true : enabledValue === "false" ? false : null
  };
};

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, "");

const getStoredSettings = async (): Promise<StoredSettingRow | null> => {
  const data = await prisma.oTAProviderSetting.findUnique({
    where: { provider: "KLOOK" },
    select: {
      id: true,
      provider: true,
      apiBaseUrl: true,
      clientId: true,
      apiKey: true,
      environment: true,
      isEnabled: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return (data as StoredSettingRow | null) ?? null;
};

export const getKlookSettingsView = async (): Promise<KlookSettingsView> => {
  const stored = await getStoredSettings();
  const env = readEnvOverrides();

  const hasEnvValues = Boolean(env.apiBaseUrl || env.clientId || env.apiKey || env.environment || env.isEnabled !== null);
  const hasStoredValues = Boolean(stored);

  const source: KlookSettingsView["source"] =
    hasEnvValues && hasStoredValues ? "MIXED" : hasEnvValues ? "ENV" : "DB";

  const apiBaseUrl = env.apiBaseUrl || stored?.apiBaseUrl || "";
  const clientId = env.clientId || stored?.clientId || "";
  const environment = env.environment || stored?.environment || "SANDBOX";
  const isEnabled = env.isEnabled ?? stored?.isEnabled ?? false;
  const activeApiKey = env.apiKey || stored?.apiKey || "";

  return {
    apiBaseUrl,
    clientId,
    environment,
    isEnabled,
    hasApiKey: Boolean(activeApiKey),
    apiKeyPreview: activeApiKey ? maskSecret(activeApiKey) : null,
    source
  };
};

export const updateKlookSettings = async (
  input: KlookSettingsUpdateInput,
  actorUserId?: string
): Promise<KlookSettingsView> => {
  const stored = await getStoredSettings();
  const normalizedBaseUrl = normalizeBaseUrl(input.apiBaseUrl);

  if (!normalizedBaseUrl) {
    throw new Error("Klook API base URL is required");
  }

  if (!/^https?:\/\//i.test(normalizedBaseUrl)) {
    throw new Error("Klook API base URL must start with http:// or https://");
  }

  const nextApiKey = input.clearApiKey ? null : input.apiKey?.trim() || stored?.apiKey || null;

  const settingId = stored?.id ?? crypto.randomUUID();
  const data = {
    apiBaseUrl: normalizedBaseUrl,
    clientId: input.clientId?.trim() || null,
    apiKey: nextApiKey,
    environment: input.environment,
    isEnabled: input.isEnabled
  };

  if (stored) {
    await prisma.oTAProviderSetting.update({
      where: { id: stored.id },
      data
    });
  } else {
    await prisma.oTAProviderSetting.create({
      data: {
        id: settingId,
        provider: "KLOOK",
        ...data
      }
    });
  }

  if (actorUserId) {
    await logActivity({
      userId: actorUserId,
      action: "KLOOK_SETTINGS_UPDATED",
      entityType: "OTA_PROVIDER",
      entityId: settingId,
      description: "Updated Klook integration settings"
    });
  }

  return getKlookSettingsView();
};

export const resolveKlookRuntimeConfig = async (): Promise<KlookRuntimeConfig> => {
  const stored = await getStoredSettings();
  const env = readEnvOverrides();

  const apiBaseUrl = normalizeBaseUrl(env.apiBaseUrl || stored?.apiBaseUrl || "");
  const clientId = env.clientId || stored?.clientId || "";
  const apiKey = env.apiKey || stored?.apiKey || "";
  const environment = env.environment || stored?.environment || "SANDBOX";
  const isEnabled = env.isEnabled ?? stored?.isEnabled ?? false;

  if (!isEnabled) {
    throw new Error("Klook integration is disabled in settings.");
  }

  if (!apiBaseUrl) {
    throw new Error("Missing Klook API base URL.");
  }

  if (!apiKey) {
    throw new Error("Missing Klook API key.");
  }

  return {
    apiBaseUrl,
    clientId,
    apiKey,
    environment,
    isEnabled
  };
};

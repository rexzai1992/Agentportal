import type { ApiErrorShape } from "@/lib/fetcher";

export type UploadDocType = "KPL" | "SSM" | "PAYMENT_SLIP" | "ANNOUNCEMENT_MEDIA" | "OTHER";
export type UploadOwnerType =
  | "REGISTRATION"
  | "AGENT"
  | "RENEWAL"
  | "OFFLINE_PAYMENT"
  | "ANNOUNCEMENT";

export interface UploadResult {
  documentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadOptions {
  docType: UploadDocType;
  ownerType: UploadOwnerType;
  ownerId?: string;
  licenseNo?: string;
  expiryDate?: string;
}

/**
 * Uploads a file via multipart/form-data. Bypasses apiFetch (which is JSON-only).
 */
export async function uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("docType", options.docType);
  formData.append("ownerType", options.ownerType);
  if (options.ownerId) formData.append("ownerId", options.ownerId);
  if (options.licenseNo) formData.append("licenseNo", options.licenseNo);
  if (options.expiryDate) formData.append("expiryDate", options.expiryDate);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  const body = (await response.json().catch(() => null)) as
    | (ApiErrorShape & { data?: UploadResult })
    | null;

  if (!response.ok) {
    throw new Error(body?.error?.message || `Upload failed (${response.status})`);
  }

  return body?.data as UploadResult;
}

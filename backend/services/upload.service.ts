import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DocumentOwnerType, DocumentType } from "@prisma/client";
import { prisma } from "@backend/services/db";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_DIR
} from "@backend/services/constants";
import { logActivity } from "@backend/services/activity.service";

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  docType: DocumentType;
  ownerType: DocumentOwnerType;
  ownerId?: string | null;
  uploadedByUserId?: string | null;
  licenseNo?: string | null;
  expiryDate?: Date | null;
}

const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);

const resolveUploadRoot = (): string =>
  path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.join(process.cwd(), "..", UPLOAD_DIR);

const assertValid = (input: Pick<UploadInput, "mimeType" | "size">): void => {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error("Unsupported file type. Only JPG, PNG and PDF are allowed.");
  }
  if (input.size <= 0) {
    throw new Error("Empty file");
  }
  if (input.size > MAX_UPLOAD_BYTES) {
    throw new Error("File too large. Maximum size is 5 MB.");
  }
};

export const saveUpload = async (input: UploadInput) => {
  assertValid(input);

  const root = resolveUploadRoot();
  await fs.mkdir(root, { recursive: true });

  const id = crypto.randomUUID();
  const safeName = sanitizeFileName(input.originalName || "file");
  const storedName = `${id}_${safeName}`;
  const absolutePath = path.join(root, storedName);

  await fs.writeFile(absolutePath, input.buffer);

  const document = await prisma.document.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId ?? null,
      docType: input.docType,
      fileName: safeName,
      storagePath: storedName,
      mimeType: input.mimeType,
      sizeBytes: input.size,
      licenseNo: input.licenseNo ?? null,
      expiryDate: input.expiryDate ?? null,
      uploadedByUserId: input.uploadedByUserId ?? null
    }
  });

  if (input.uploadedByUserId) {
    await logActivity({
      userId: input.uploadedByUserId,
      action: "DOCUMENT_UPLOADED",
      entityType: "DOCUMENT",
      entityId: document.id,
      description: `Uploaded ${input.docType} document ${safeName}`
    });
  }

  return {
    documentId: document.id,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes
  };
};

export const getDocumentForDownload = async (id: string) => {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    throw new Error("Document not found");
  }

  const root = resolveUploadRoot();
  const absolutePath = path.join(root, document.storagePath);
  const buffer = await fs.readFile(absolutePath);

  return {
    buffer,
    fileName: document.fileName,
    mimeType: document.mimeType
  };
};

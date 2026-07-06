import {
  AnnouncementAudience,
  AnnouncementDisplay,
  AnnouncementStatus
} from "@prisma/client";
import { prisma } from "@backend/services/db";
import { logActivity } from "@backend/services/activity.service";

const deriveStatus = (status: AnnouncementStatus, expiry: Date): AnnouncementStatus => {
  if (status === "ACTIVE" && expiry.getTime() < Date.now()) return "EXPIRED";
  return status;
};

export interface AnnouncementInput {
  title: string;
  body?: string | null;
  mediaDocumentId?: string | null;
  displayType: AnnouncementDisplay;
  audience: AnnouncementAudience;
  effectiveDate: string;
  expiryDate: string;
  status: AnnouncementStatus;
}

export const listAnnouncements = async () => {
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    ...r,
    effectiveDate: r.effectiveDate.toISOString(),
    expiryDate: r.expiryDate.toISOString(),
    status: deriveStatus(r.status, r.expiryDate)
  }));
};

export const createAnnouncement = async (input: AnnouncementInput, adminUserId: string) => {
  if (!input.title?.trim()) throw new Error("Title is required");
  const created = await prisma.announcement.create({
    data: {
      title: input.title.trim(),
      body: input.body?.trim() || null,
      mediaDocumentId: input.mediaDocumentId || null,
      displayType: input.displayType,
      audience: input.audience,
      effectiveDate: new Date(input.effectiveDate),
      expiryDate: new Date(input.expiryDate),
      status: input.status,
      createdByUserId: adminUserId
    }
  });
  await logActivity({
    userId: adminUserId,
    action: "ANNOUNCEMENT_CREATED",
    entityType: "ANNOUNCEMENT",
    entityId: created.id,
    description: `Created announcement ${created.title}`
  });
  return created;
};

export const updateAnnouncement = async (
  id: string,
  input: Partial<AnnouncementInput>,
  adminUserId: string
) => {
  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      title: input.title?.trim(),
      body: input.body?.trim() ?? undefined,
      displayType: input.displayType,
      audience: input.audience,
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : undefined,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      status: input.status
    }
  });
  await logActivity({
    userId: adminUserId,
    action: "ANNOUNCEMENT_UPDATED",
    entityType: "ANNOUNCEMENT",
    entityId: id,
    description: `Updated announcement ${updated.title}`
  });
  return updated;
};

export const deleteAnnouncement = async (id: string) => {
  await prisma.announcement.delete({ where: { id } });
  return { id };
};

/** Active announcements for agents/partners, filtered by audience + placement. */
export const getActiveAnnouncements = async (params: {
  partyType?: "AGENT" | "PARTNER" | null;
  displayType?: AnnouncementDisplay;
}) => {
  const now = new Date();
  const audiences: AnnouncementAudience[] = ["BOTH"];
  if (params.partyType === "AGENT") audiences.push("AGENT");
  if (params.partyType === "PARTNER") audiences.push("PARTNER");

  const rows = await prisma.announcement.findMany({
    where: {
      status: "ACTIVE",
      displayType: params.displayType,
      audience: { in: audiences },
      effectiveDate: { lte: now },
      expiryDate: { gte: now }
    },
    orderBy: { effectiveDate: "desc" }
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    mediaDocumentId: r.mediaDocumentId,
    effectiveDate: r.effectiveDate.toISOString()
  }));
};

import { NextRequest } from "next/server";
import { announcementController } from "@backend/controllers/announcement.controller";
import type { AnnouncementInput } from "@backend/services/announcement.service";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<Partial<AnnouncementInput>>(request);
    const updated = await announcementController.update(id, body, context.user.id);
    return ok(updated);
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async () => ok(await announcementController.remove(id)));
}

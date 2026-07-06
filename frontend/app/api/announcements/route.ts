import { NextRequest } from "next/server";
import { announcementController } from "@backend/controllers/announcement.controller";
import type { AnnouncementInput } from "@backend/services/announcement.service";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => ok(await announcementController.list()));
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<AnnouncementInput>(request);
    const created = await announcementController.create(body, context.user.id);
    return ok(created, 201);
  });
}

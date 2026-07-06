import { NextRequest } from "next/server";
import { AnnouncementDisplay } from "@prisma/client";
import { announcementController } from "@backend/controllers/announcement.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT"], async (context) => {
    const displayType = (request.nextUrl.searchParams.get("displayType") as AnnouncementDisplay) || "HOME";
    const data = await announcementController.active({
      partyType: context.user.partyType ?? null,
      displayType
    });
    return ok(data);
  });
}

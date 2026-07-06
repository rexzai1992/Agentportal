import { NextRequest } from "next/server";
import { registrationController } from "@backend/controllers/registration.controller";
import { fail, ok, withErrorHandling } from "@/lib/api";

// Public: check application status by Application ID.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const applicationId = request.nextUrl.searchParams.get("applicationId");
    if (!applicationId) {
      return fail("Application ID is required", 400);
    }
    const result = await registrationController.status(applicationId);
    return ok(result);
  });
}

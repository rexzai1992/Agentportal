import { NextRequest } from "next/server";
import { PartyType } from "@prisma/client";
import { registrationController } from "@backend/controllers/registration.controller";
import type { CreateRegistrationInput } from "@backend/services/registration.service";
import { fail, ok, parseBody, withErrorHandling } from "@/lib/api";

// Public: self-service registration submission.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await parseBody<CreateRegistrationInput>(request);

    if (body.partyType !== "AGENT" && body.partyType !== "PARTNER") {
      return fail("Invalid party type", 400);
    }

    const result = await registrationController.create({
      ...body,
      partyType: body.partyType as PartyType
    });

    return ok(result, 201);
  });
}

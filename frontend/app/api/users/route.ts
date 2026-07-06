import { NextRequest } from "next/server";
import { userController } from "@backend/controllers/user.controller";
import { Role } from "@shared/types/domain";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface CreateUserBody {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  agentId?: string | null;
}

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const users = await userController.listUsers();
    return ok(users);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async (context) =>
    withErrorHandling(async () => {
      const body = await parseBody<CreateUserBody>(request);
      if (!body.fullName || !body.email || !body.password || !body.role) {
        return fail("Missing required user fields", 400);
      }

      const user = await userController.createUser({
        fullName: body.fullName,
        email: body.email,
        password: body.password,
        role: body.role,
        agentId: body.agentId,
        createdByUserId: context.user.id
      });

      return ok(user, 201);
    })
  );
}

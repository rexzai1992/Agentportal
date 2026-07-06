import bcrypt from "bcryptjs";
import { logActivity } from "@backend/services/activity.service";
import { prisma } from "@backend/services/db";
import { Role } from "@shared/types/domain";

export const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      agentId: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  const safeUsers = users ?? [];
  const agentIds = Array.from(
    new Set(safeUsers.map((user) => user.agentId).filter((agentId): agentId is string => Boolean(agentId)))
  );

  const agents = agentIds.length
    ? await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, companyName: true }
      })
    : [];

  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  return safeUsers.map((user) => ({
    ...user,
    agent: user.agentId ? { companyName: agentById.get(user.agentId)?.companyName ?? "" } : null
  }));
};

export const createUser = async (params: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  agentId?: string | null;
  createdByUserId: string;
}) => {
  if (params.role === "AGENT" && !params.agentId) {
    throw new Error("Agent user must be linked to an agent account");
  }

  if (params.role !== "AGENT") {
    params.agentId = null;
  }

  const existing = await prisma.user.findUnique({
    where: { email: params.email.toLowerCase() },
    select: { id: true }
  });

  if (existing) {
    throw new Error("Email already exists");
  }

  const passwordHash = await bcrypt.hash(params.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: params.fullName,
      email: params.email.toLowerCase(),
      passwordHash,
      role: params.role,
      agentId: params.agentId ?? null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      agentId: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error("Unable to create user");
  }

  await logActivity({
    userId: params.createdByUserId,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: user.id,
    description: `Created user ${user.email}`
  });

  return user;
};

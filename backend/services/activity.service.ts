import { prisma } from "@backend/services/db";

export const logActivity = async (input: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
}): Promise<void> => {
  await prisma.activityLog.create({ data: input });
};

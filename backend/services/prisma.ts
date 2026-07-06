import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import type { Prisma, PrismaClient as PrismaClientType } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  const envCandidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "frontend/.env.local"),
    path.resolve(process.cwd(), "frontend/.env")
  ];

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      if (process.env.DATABASE_URL) break;
    }
  }
}

const fallbackDatabaseUrl = "postgresql://travel_agent:travel_agent@localhost:5432/travel_agent";
const resolvedDatabaseUrl = process.env.DATABASE_URL || fallbackDatabaseUrl;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };
const prismaLogs: Prisma.LogLevel[] =
  process.env.PRISMA_QUERY_LOGS === "true"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDatabaseUrl
      }
    },
    log: prismaLogs
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

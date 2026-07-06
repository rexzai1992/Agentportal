export { prisma } from "@backend/services/prisma";

export const nowIso = (): string => new Date().toISOString();

export const asNumber = (value: number | string | { toString(): string } | null | undefined): number =>
  Number(value ?? 0);

export const toMoney = (value: number): number => Number(value.toFixed(2));

export const toCents = (value: number): number => Math.round(value * 100);

export const fromCents = (value: number): number => value / 100;

export const round2 = (value: number): number => Math.round(value * 100) / 100;

export const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

import { addDays, format } from "date-fns";

export const addSettlementDays = (date: Date, days: number): Date => addDays(date, days);

export const formatDate = (date: Date): string => format(date, "yyyy-MM-dd");

export const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

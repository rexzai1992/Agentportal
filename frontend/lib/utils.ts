import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2
  }).format(value || 0);

export const formatDate = (value: string | Date): string =>
  new Intl.DateTimeFormat("en-MY", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));

export const formatDateTime = (value: string | Date): string =>
  new Intl.DateTimeFormat("en-MY", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

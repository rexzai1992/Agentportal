import type { BadgeTone } from "@/components/ui/badge";

export const formatStatusLabel = (status: string) => status.replace(/_/g, " ");

export const statusTone = (status: string): BadgeTone => {
  const normalized = status.trim().toUpperCase().replace(/\s+/g, "_");

  if (["ORDER_CONFIRMED", "APPROVED", "ACTIVE", "PAID", "PREPAID_PAID", "REDEEMED", "USED", "CONFIRMED"].includes(normalized)) {
    return "success";
  }

  if (["PENDING_APPROVAL", "PENDING", "RESERVED"].includes(normalized)) {
    return "info";
  }

  if (["PENDING_PAYMENT", "UNBILLED", "INVOICED", "LOCKED", "NEW", "ISSUED"].includes(normalized)) {
    return "warning";
  }

  if (["REVISION", "DRAFT"].includes(normalized)) {
    return "purple";
  }

  if (["REJECTED", "FAILED", "OVERDUE", "EXPIRED", "CANCELLED", "INACTIVE"].includes(normalized)) {
    return "danger";
  }

  return "default";
};

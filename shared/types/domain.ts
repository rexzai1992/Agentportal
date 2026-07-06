export type Role = "ADMIN" | "AGENT" | "STAFF" | "FINANCE";
export type PartyType = "AGENT" | "PARTNER";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVISION";
export type VoucherRedeemStatus = "NEW" | "LOCKED" | "REDEEMED" | "EXPIRED";
export type AgreementType = "PREPAID" | "WEEKLY" | "MONTHLY";
export type TicketCategory = "ADULT" | "CHILD" | "BUNDLE";
export type ValidityType = "SAME_DAY" | "FIXED_DATE" | "DATE_RANGE";
export type BookingPaymentStatus = "PREPAID_PAID" | "UNBILLED" | "INVOICED" | "PAID";
export type TicketStatus = "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  username?: string | null;
  role: Role;
  agentId?: string | null;
  partyType?: PartyType | null;
  accountStatus?: AccountStatus | null;
  accountExpiry?: string | null;
  mustChangePassword?: boolean;
}

export interface QRPayload {
  ticketId: string;
  qrToken: string;
  signature: string;
  ts: number;
}

export interface SyncQueueItem {
  id: string;
  type: "BOOKING" | "SCAN";
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

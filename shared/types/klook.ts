export type OTAProviderName = "KLOOK";
export type KlookEnvironment = "SANDBOX" | "PRODUCTION";
export type KlookOrderStatus = "PENDING" | "RESERVED" | "CONFIRMED" | "CANCELLED" | "FAILED" | "REDEEMED";

export interface KlookSettingsView {
  apiBaseUrl: string;
  clientId: string;
  environment: KlookEnvironment;
  isEnabled: boolean;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  source: "DB" | "ENV" | "MIXED";
}

export interface KlookSettingsUpdateInput {
  apiBaseUrl: string;
  clientId?: string;
  apiKey?: string;
  clearApiKey?: boolean;
  environment: KlookEnvironment;
  isEnabled: boolean;
}

export interface KlookLocalProductOption {
  id: string;
  name: string;
  sku?: string | null;
}

export interface KlookUnitSummary {
  id: string;
  label: string;
  type: string;
  requiredContactFields: string[];
  restrictions?: Record<string, unknown> | null;
  pricingFrom?: KlookPricing | null;
}

export interface KlookOptionSummary {
  id: string;
  label: string;
  isDefault: boolean;
  availabilityLocalStartTimes: string[];
  requiredContactFields: string[];
  units: KlookUnitSummary[];
}

export interface KlookProductView {
  id: string;
  klookProductId: string;
  localProductId: string | null;
  title: string;
  description: string | null;
  city: string | null;
  country: string | null;
  category: string | null;
  voucherType: string | null;
  confirmationType: string | null;
  packageOptionsJson: unknown;
  bookingPolicyJson: unknown;
  rawJson: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  localProduct: KlookLocalProductOption | null;
  options: KlookOptionSummary[];
}

export interface KlookPricingTax {
  name: string;
  retail: number;
  net: number;
}

export interface KlookPricing {
  original: number;
  retail: number;
  net: number | null;
  currency: string;
  currencyPrecision: number;
  includedTaxes?: KlookPricingTax[];
}

export interface KlookAvailabilitySlot {
  availabilityId: string;
  localDateTimeStart: string;
  localDateTimeEnd: string;
  allDay: boolean;
  available: boolean;
  status: string;
  vacancies: number | null;
  capacity: number | null;
  maxUnits: number | null;
  utcCutoffAt: string | null;
  openingHours: Array<{ from: string; to: string }>;
  pricing: KlookPricing | null;
}

export interface KlookAvailabilityCheckInput {
  productId: string;
  localProductId?: string | null;
  optionId: string;
  travelDate: string;
  units: Array<{ id: string; quantity: number }>;
}

export interface KlookAvailabilityCheckResult {
  request: KlookAvailabilityCheckInput;
  slots: KlookAvailabilitySlot[];
  selectedAvailabilityId: string | null;
  selectedStatus: string | null;
}

export interface KlookBookingUnitSelection {
  unitId: string;
  quantity: number;
}

export interface KlookBookingCreateInput {
  localOrderId?: string;
  productId: string;
  localProductId?: string | null;
  optionId: string;
  availabilityId: string;
  travelDate?: string | null;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  units: KlookBookingUnitSelection[];
  confirmBooking?: boolean;
  emailReceipt?: boolean;
}

export interface KlookVoucherArtifact {
  voucherCode: string | null;
  voucherUrl: string | null;
  redemptionMethod: string | null;
}

export interface KlookOrderView {
  id: string;
  localOrderId: string;
  klookOrderId: string | null;
  klookBookingReference: string | null;
  klookProductId: string;
  localProductId: string | null;
  availabilityId: string | null;
  travelDate: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  quantityAdult: number;
  quantityChild: number;
  totalAmount: number | null;
  currency: string | null;
  status: KlookOrderStatus;
  voucherCode: string | null;
  voucherUrl: string | null;
  createdAt: string;
  updatedAt: string;
  redeemedAt: string | null;
  redeemedByStaffId: string | null;
  localProduct: KlookLocalProductOption | null;
  productTitle: string | null;
}

export interface KlookBookingCreateResult {
  order: KlookOrderView;
  reservationStatus: string;
  confirmationStatus: string | null;
}

export interface KlookOrderSearchResult {
  items: KlookOrderView[];
}

export interface KlookRedeemInput {
  voucherCode: string;
  bookingReference?: string;
  staffId: string;
}

export interface KlookRedeemResult {
  success: boolean;
  message: string;
  order: KlookOrderView | null;
}

export interface OtaApiLogView {
  id: string;
  otaProvider: OTAProviderName;
  action: string;
  endpoint: string;
  method: string;
  responseStatus: number | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface KlookSalesReportFilters {
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  status?: KlookOrderStatus | "ALL";
}

export interface KlookSalesReportRow extends KlookOrderView {}

export interface KlookSalesReportResult {
  filters: KlookSalesReportFilters;
  totals: {
    totalBookings: number;
    totalConfirmed: number;
    totalCancelled: number;
    totalRedeemed: number;
    totalSalesAmount: number;
  };
  rows: KlookSalesReportRow[];
}

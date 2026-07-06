import { KlookBookingUnitSelection, KlookPricing, KlookVoucherArtifact } from "@shared/types/klook";

export interface OctoContact {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  notes?: string | null;
  locales?: string[];
}

export interface OctoDeliveryOption {
  deliveryFormat: "PDF_URL" | "QRCODE";
  deliveryValue: string;
}

export interface OctoVoucherLike {
  redemptionMethod?: string | null;
  utcRedeemedAt?: string | null;
  deliveryOptions?: OctoDeliveryOption[];
}

export interface OctoUnit {
  id: string;
  internalName: string;
  reference?: string | null;
  type: string;
  requiredContactFields?: string[];
  restrictions?: Record<string, unknown> | null;
  pricingFrom?: KlookPricing[];
}

export interface OctoOption {
  id: string;
  default?: boolean;
  internalName: string;
  reference?: string | null;
  availabilityLocalStartTimes?: string[];
  cancellationCutoff?: string | null;
  cancellationCutoffAmount?: number | null;
  cancellationCutoffUnit?: string | null;
  requiredContactFields?: string[];
  restrictions?: Record<string, unknown> | null;
  units?: OctoUnit[];
}

export interface OctoProduct {
  id: string;
  internalName: string;
  reference?: string | null;
  locale: string;
  timeZone: string;
  allowFreesale: boolean;
  instantConfirmation: boolean;
  instantDelivery: boolean;
  availabilityRequired: boolean;
  availabilityType: string;
  deliveryFormats: string[];
  deliveryMethods: string[];
  redemptionMethod: string;
  defaultCurrency?: string;
  availableCurrencies?: string[];
  pricingPer?: string;
  options: OctoOption[];
  [key: string]: unknown;
}

export interface OctoAvailability {
  id: string;
  localDateTimeStart: string;
  localDateTimeEnd: string;
  allDay: boolean;
  available: boolean;
  status: string;
  vacancies?: number | null;
  capacity?: number | null;
  maxUnits?: number | null;
  utcCutoffAt?: string | null;
  openingHours?: Array<{ from: string; to: string }>;
  pricing?: KlookPricing;
  [key: string]: unknown;
}

export interface OctoBookingUnitItemResponse {
  uuid?: string;
  resellerReference?: string | null;
  supplierReference?: string | null;
  unitId: string;
  unit?: OctoUnit;
  status?: string;
  utcRedeemedAt?: string | null;
  contact?: OctoContact | null;
  ticket?: OctoVoucherLike | null;
  [key: string]: unknown;
}

export interface OctoBooking {
  id: string;
  uuid: string;
  resellerReference?: string | null;
  supplierReference?: string | null;
  status: string;
  utcCreatedAt: string;
  utcUpdatedAt?: string | null;
  utcExpiresAt?: string | null;
  utcRedeemedAt?: string | null;
  utcConfirmedAt?: string | null;
  productId: string;
  product?: OctoProduct;
  optionId?: string;
  option?: OctoOption;
  cancellable?: boolean;
  cancellation?: unknown;
  freesale?: boolean;
  availabilityId?: string;
  availability?: Partial<OctoAvailability>;
  contact?: OctoContact | null;
  notes?: string | null;
  deliveryMethods?: string[];
  voucher?: OctoVoucherLike | null;
  unitItems: OctoBookingUnitItemResponse[];
  pricing?: KlookPricing;
  [key: string]: unknown;
}

export interface KlookRuntimeConfig {
  apiBaseUrl: string;
  clientId: string;
  apiKey: string;
  environment: "SANDBOX" | "PRODUCTION";
  isEnabled: boolean;
}

export interface ExpandedKlookUnitItem {
  uuid: string;
  unitId: string;
}

export interface UnitCounts {
  quantityAdult: number;
  quantityChild: number;
}

export interface RedemptionValidationResult {
  allowed: boolean;
  message: string;
}

export interface KlookMappedVoucher extends KlookVoucherArtifact {}

export interface KlookExpandedSelection {
  expandedItems: ExpandedKlookUnitItem[];
  summary: KlookBookingUnitSelection[];
}

import crypto from "node:crypto";
import {
  KlookBookingUnitSelection,
  KlookOptionSummary,
  KlookPricing,
  KlookProductView,
  KlookUnitSummary,
  KlookVoucherArtifact,
  KlookOrderStatus
} from "@shared/types/klook";
import {
  ExpandedKlookUnitItem,
  KlookMappedVoucher,
  OctoBooking,
  OctoBookingUnitItemResponse,
  OctoOption,
  OctoProduct,
  OctoVoucherLike,
  RedemptionValidationResult,
  UnitCounts
} from "@backend/services/ota/providers/klook/klookTypes";

const firstNonEmpty = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

const pickDeliveryOption = (
  vouchers: Array<OctoVoucherLike | null | undefined>,
  format: "PDF_URL" | "QRCODE"
): string | null => {
  for (const voucher of vouchers) {
    const match = voucher?.deliveryOptions?.find((item) => item.deliveryFormat === format);
    if (match?.deliveryValue) {
      return match.deliveryValue;
    }
  }
  return null;
};

export const inferVoucherType = (product: OctoProduct): string | null =>
  product.deliveryMethods?.length ? product.deliveryMethods.join(", ") : null;

export const inferConfirmationType = (product: OctoProduct): string =>
  product.instantConfirmation ? "INSTANT" : "MANUAL";

export const buildBookingPolicyJson = (product: OctoProduct): Record<string, unknown> => ({
  allowFreesale: product.allowFreesale,
  availabilityRequired: product.availabilityRequired,
  availabilityType: product.availabilityType,
  instantConfirmation: product.instantConfirmation,
  instantDelivery: product.instantDelivery,
  options: (product.options ?? []).map((option) => ({
    id: option.id,
    label: option.internalName,
    cancellationCutoff: option.cancellationCutoff ?? null,
    cancellationCutoffAmount: option.cancellationCutoffAmount ?? null,
    cancellationCutoffUnit: option.cancellationCutoffUnit ?? null,
    requiredContactFields: option.requiredContactFields ?? [],
    restrictions: option.restrictions ?? null
  }))
});

export const summarizeOptions = (product: OctoProduct): KlookOptionSummary[] =>
  (product.options ?? []).map((option) => ({
    id: option.id,
    label: option.internalName,
    isDefault: Boolean(option.default),
    availabilityLocalStartTimes: option.availabilityLocalStartTimes ?? [],
    requiredContactFields: option.requiredContactFields ?? [],
    units: (option.units ?? []).map(
      (unit): KlookUnitSummary => ({
        id: unit.id,
        label: unit.internalName,
        type: unit.type,
        requiredContactFields: unit.requiredContactFields ?? [],
        restrictions: unit.restrictions ?? null,
        pricingFrom: unit.pricingFrom?.[0] ?? null
      })
    )
  }));

export const mapKlookOrderStatus = (status: string | null | undefined): KlookOrderStatus => {
  switch (status) {
    case "ON_HOLD":
      return "RESERVED";
    case "CONFIRMED":
      return "CONFIRMED";
    case "CANCELLED":
      return "CANCELLED";
    case "REDEEMED":
      return "REDEEMED";
    case "PENDING":
      return "PENDING";
    case "EXPIRED":
    case "REJECTED":
      return "FAILED";
    default:
      return "FAILED";
  }
};

export const moneyFromPricing = (pricing: KlookPricing | null | undefined): number | null => {
  if (!pricing) {
    return null;
  }

  return Number((pricing.retail / 10 ** pricing.currencyPrecision).toFixed(pricing.currencyPrecision));
};

export const extractVoucherArtifacts = (booking: OctoBooking): KlookMappedVoucher => {
  const voucherSources: Array<OctoVoucherLike | null | undefined> = [
    booking.voucher,
    ...booking.unitItems.map((item) => item.ticket)
  ];

  return {
    voucherCode: firstNonEmpty(
      pickDeliveryOption(voucherSources, "QRCODE"),
      booking.supplierReference,
      booking.resellerReference
    ),
    voucherUrl: pickDeliveryOption(voucherSources, "PDF_URL"),
    redemptionMethod: firstNonEmpty(
      booking.voucher?.redemptionMethod ?? null,
      booking.unitItems.find((item) => item.ticket?.redemptionMethod)?.ticket?.redemptionMethod ?? null
    )
  };
};

export const expandUnitSelections = (units: KlookBookingUnitSelection[]): ExpandedKlookUnitItem[] => {
  const expanded: ExpandedKlookUnitItem[] = [];

  for (const unit of units) {
    for (let index = 0; index < unit.quantity; index += 1) {
      expanded.push({
        uuid: crypto.randomUUID(),
        unitId: unit.unitId
      });
    }
  }

  return expanded;
};

export const countUnitSelections = (units: KlookBookingUnitSelection[], option?: OctoOption): UnitCounts => {
  const unitTypeById = new Map((option?.units ?? []).map((unit) => [unit.id, unit.type]));

  return units.reduce<UnitCounts>(
    (acc, item) => {
      const normalizedType = unitTypeById.get(item.unitId)?.toUpperCase() ?? "";
      if (normalizedType === "CHILD" || normalizedType === "INFANT" || normalizedType === "YOUTH") {
        acc.quantityChild += item.quantity;
      } else {
        acc.quantityAdult += item.quantity;
      }
      return acc;
    },
    { quantityAdult: 0, quantityChild: 0 }
  );
};

export const selectAvailabilityId = (
  slots: Array<{ availabilityId: string; available: boolean; status: string }>
): string | null => {
  const preferred = slots.find((slot) => slot.available && ["AVAILABLE", "FREESALE", "LIMITED"].includes(slot.status));
  return preferred?.availabilityId ?? slots[0]?.availabilityId ?? null;
};

export const extractTravelDate = (booking: OctoBooking, fallback?: string | null): string | null =>
  booking.availability?.localDateTimeStart?.slice(0, 10) ?? fallback ?? null;

export const splitFullName = (fullName: string): { firstName: string; lastName: string | null } => {
  const trimmed = fullName.trim();
  const [firstName, ...rest] = trimmed.split(/\s+/);

  return {
    firstName,
    lastName: rest.length ? rest.join(" ") : null
  };
};

export const evaluateInternalRedemption = (
  order: { status: KlookOrderStatus; travelDate?: string | null; redeemedAt?: string | null },
  now: Date,
  timeZone = process.env.APP_TIMEZONE || "Asia/Kuala_Lumpur"
): RedemptionValidationResult => {
  if (order.redeemedAt || order.status === "REDEEMED") {
    return {
      allowed: false,
      message: "This ticket has already been redeemed."
    };
  }

  if (order.status !== "CONFIRMED") {
    return {
      allowed: false,
      message: "Only confirmed Klook bookings can be redeemed."
    };
  }

  if (!order.travelDate) {
    return {
      allowed: true,
      message: "Ready for redemption."
    };
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  if (order.travelDate > today) {
    return {
      allowed: false,
      message: "This ticket is not valid for redemption before the travel date."
    };
  }

  if (order.travelDate < today) {
    return {
      allowed: false,
      message: "This ticket is no longer valid for redemption."
    };
  }

  return {
    allowed: true,
    message: "Ready for redemption."
  };
};

export const buildKlookProductView = (
  row: Omit<KlookProductView, "options">
): KlookProductView => {
  const rawProduct = row.rawJson as OctoProduct;
  return {
    ...row,
    options: rawProduct?.options ? summarizeOptions(rawProduct) : []
  };
};

export const buildPerUnitReferences = (
  localOrderId: string,
  unitItems: ExpandedKlookUnitItem[]
): Array<Pick<OctoBookingUnitItemResponse, "uuid" | "unitId" | "resellerReference">> =>
  unitItems.map((item, index) => ({
    uuid: item.uuid,
    unitId: item.unitId,
    resellerReference: `${localOrderId}-${String(index + 1).padStart(2, "0")}`
  }));

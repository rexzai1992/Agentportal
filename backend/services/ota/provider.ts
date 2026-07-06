export interface OTAProvider<
  ProductResult = unknown,
  AvailabilityResult = unknown,
  BookingResult = unknown,
  StatusResult = unknown,
  RedemptionResult = unknown
> {
  syncProducts(): Promise<ProductResult>;
  checkAvailability(input: unknown): Promise<AvailabilityResult>;
  createBooking(input: unknown): Promise<BookingResult>;
  getBookingStatus(reference: string): Promise<StatusResult>;
  redeemInternally(input: unknown): Promise<RedemptionResult>;
}

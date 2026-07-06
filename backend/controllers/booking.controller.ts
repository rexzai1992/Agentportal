import { createBooking, getBookingById, listBookings } from "@backend/services/booking.service";

export const bookingController = {
  listBookings,
  createBooking,
  getBookingById
};

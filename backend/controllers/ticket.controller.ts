import {
  generateTicketQrDataUrl,
  generateTicketQrDataUrlFromPayload,
  generateTicketQrPayload,
  getTicketById,
  listTickets,
  validateTicketScan
} from "@backend/services/ticket.service";

export const ticketController = {
  listTickets,
  getTicketById,
  generateTicketQrPayload,
  generateTicketQrDataUrl,
  generateTicketQrDataUrlFromPayload,
  validateTicketScan
};

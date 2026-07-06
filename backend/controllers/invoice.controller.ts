import { generateInvoices, listInvoices, markInvoicePaid } from "@backend/services/invoice.service";

export const invoiceController = {
  listInvoices,
  generateInvoices,
  markInvoicePaid
};

import {
  getAgentPerformanceReport,
  getCommissionReport,
  getInvoiceReport,
  getSalesReport,
  getUsageReport
} from "@backend/services/report.service";

export const reportController = {
  getSalesReport,
  getCommissionReport,
  getUsageReport,
  getInvoiceReport,
  getAgentPerformanceReport
};

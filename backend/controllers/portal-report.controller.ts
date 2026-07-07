import {
  complimentaryReport,
  getAdminCounts,
  getAgentDashboard,
  paymentReport,
  purchaseDetailsReport,
  purchaseReport,
  ticketReport,
  topPurchaseReport,
  voucherIssuedReport
} from "@backend/services/portal-report.service";

export const portalReportController = {
  adminCounts: getAdminCounts,
  agentDashboard: getAgentDashboard,
  purchase: purchaseReport,
  purchaseDetails: purchaseDetailsReport,
  topPurchase: topPurchaseReport,
  voucherIssued: voucherIssuedReport,
  ticket: ticketReport,
  payment: paymentReport,
  complimentary: complimentaryReport
};

import {
  complimentaryReport,
  getAdminCounts,
  getAgentDashboard,
  paymentReport,
  purchaseDetailsReport,
  purchaseReport,
  ticketReport,
  topPurchaseReport
} from "@backend/services/portal-report.service";

export const portalReportController = {
  adminCounts: getAdminCounts,
  agentDashboard: getAgentDashboard,
  purchase: purchaseReport,
  purchaseDetails: purchaseDetailsReport,
  topPurchase: topPurchaseReport,
  ticket: ticketReport,
  payment: paymentReport,
  complimentary: complimentaryReport
};

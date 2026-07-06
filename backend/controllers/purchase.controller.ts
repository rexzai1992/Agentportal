import {
  createPurchaseOrder,
  getAgentCatalog,
  getPurchaseOrder,
  listPurchaseOrders
} from "@backend/services/purchase-order.service";
import {
  approveOfflinePayment,
  getOfflinePaymentDetail,
  listOfflinePayments,
  listPaymentGroups,
  listPaymentTypes,
  markPaymentPaid,
  submitOfflinePayment
} from "@backend/services/offline-payment.service";
import {
  getOrderVouchers,
  listVoucherGroups,
  redeemVoucher
} from "@backend/services/voucher.service";

export const purchaseController = {
  catalog: getAgentCatalog,
  createOrder: createPurchaseOrder,
  getOrder: getPurchaseOrder,
  listOrders: listPurchaseOrders,
  // offline payment
  paymentGroups: listPaymentGroups,
  paymentTypes: listPaymentTypes,
  submitPayment: submitOfflinePayment,
  listPayments: listOfflinePayments,
  paymentDetail: getOfflinePaymentDetail,
  markPaid: markPaymentPaid,
  approvePayment: approveOfflinePayment,
  // vouchers
  voucherGroups: listVoucherGroups,
  orderVouchers: getOrderVouchers,
  redeemVoucher
};

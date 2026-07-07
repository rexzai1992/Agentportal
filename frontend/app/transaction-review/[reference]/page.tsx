"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading";
import { FileUpload } from "@/components/forms/FileUpload";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface OrderDetail {
  orderReference: string;
  status: string;
  companyName: string;
  transactionDate: string;
  subtotal: number;
  discountTotal: number;
  totalPayable: number;
  items: Array<{ id: string; productName: string; productType: string; quantity: number; unitPrice: number; lineTotal: number }>;
  bankAccounts?: Array<{
    outletName: string;
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNo: string | null;
  }>;
}
interface Lookup {
  id: string;
  name: string;
}

const statusTone = (s: string) =>
  s === "ORDER_CONFIRMED" ? "success" : s === "REJECTED" ? "danger" : "warning";

export default function TransactionReviewPage() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [groups, setGroups] = useState<Lookup[]>([]);
  const [types, setTypes] = useState<Lookup[]>([]);
  const [slipDocId, setSlipDocId] = useState<string | null>(null);
  const [paymentGroupId, setPaymentGroupId] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, g, t] = await Promise.all([
        apiFetch<OrderDetail>(`/api/purchases/${params.reference}`),
        apiFetch<Lookup[]>("/api/payment-groups"),
        apiFetch<Lookup[]>("/api/payment-types")
      ]);
      setOrder(o);
      setGroups(g);
      setTypes(t);
    } finally {
      setLoading(false);
    }
  }, [params.reference]);

  useEffect(() => {
    load();
  }, [load]);

  const submitPayment = async () => {
    setError(null);
    if (!slipDocId) {
      setError("Please upload your proof of payment");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/api/purchases/${params.reference}/offline-payment`, {
        method: "POST",
        body: JSON.stringify({ slipDocumentId: slipDocId, paymentGroupId, paymentTypeId })
      });
      setPayOpen(false);
      router.push("/reports/purchase");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  const canPay = order && ["PENDING_PAYMENT", "REVISION"].includes(order.status);

  return (
    <ProtectedShell roles={["AGENT"]} title="Transaction Review" subtitle="Review your order">
      {loading || !order ? (
        <LoadingState label="Loading transaction..." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Card>
            <h3 className="section-title mb-3">Transaction Information</h3>
            <div className="space-y-2 text-sm">
              <Info label="Reference No" value={order.orderReference} />
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Status</span>
                <Badge tone={statusTone(order.status)}>{order.status.replace(/_/g, " ")}</Badge>
              </div>
              <Info label="Company" value={order.companyName} />
              <Info label="Transaction Date" value={formatDateTime(order.transactionDate)} />
            </div>

            <h3 className="section-title mb-2 mt-5">Bank Information</h3>
            {order.bankAccounts?.length ? (
              <div className="space-y-2">
                {order.bankAccounts.map((account) => (
                  <div
                    key={`${account.bankName}-${account.bankAccountNo}`}
                    className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-slate-800">
                      {account.bankName || "Bank Account"}
                    </p>
                    {account.bankAccountName ? <p>Account Name: {account.bankAccountName}</p> : null}
                    {account.bankAccountNo ? <p>Bank Account No: {account.bankAccountNo}</p> : null}
                    <p className="mt-1 text-xs text-slate-400">{account.outletName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                <p>Bank details are not available for this outlet yet. Please contact the administrator.</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="section-title mb-3">Transaction Detail</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Item Price</th>
                    <th className="px-2 py-2">Qty</th>
                    <th className="px-2 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id} className="border-t border-slate-100">
                      <td className="px-2 py-2">{i.productName}</td>
                      <td className="px-2 py-2">{formatCurrency(i.unitPrice)}</td>
                      <td className="px-2 py-2">{i.quantity}</td>
                      <td className="px-2 py-2">{formatCurrency(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1 text-right text-sm">
              <p>Sub Total: {formatCurrency(order.subtotal)}</p>
              <p>Discount: -{formatCurrency(order.discountTotal)}</p>
              <p className="font-bold">Total: {formatCurrency(order.totalPayable)}</p>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {canPay ? (
                <>
                  <Button variant="ghost" onClick={() => router.push("/ticket-purchase")}>
                    Update Cart
                  </Button>
                  <Button onClick={() => setPayOpen(true)}>Pay Offline</Button>
                </>
              ) : null}
              <Button variant="ghost" onClick={() => router.push("/reports/purchase")}>
                Back
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pay Offline">
        {error ? <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          <FileUpload
            label="Proof of Payment"
            docType="PAYMENT_SLIP"
            ownerType="OFFLINE_PAYMENT"
            required
            onUploaded={(r) => setSlipDocId(r?.documentId ?? null)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment Group</label>
            <Select value={paymentGroupId} onChange={(e) => setPaymentGroupId(e.target.value)}>
              <option value="">Please select payment group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment Type</label>
            <Select value={paymentTypeId} onChange={(e) => setPaymentTypeId(e.target.value)}>
              <option value="">Please select payment type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <Button className="w-full" onClick={submitPayment} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </Modal>
    </ProtectedShell>
  );
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);

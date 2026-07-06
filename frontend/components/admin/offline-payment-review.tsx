"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading";
import { StatusUpdatePanel, type VerificationDecision } from "@/components/shared/status-update-panel";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface PaymentDetail {
  id: string;
  companyName: string;
  accountCode: string | null;
  reference: string;
  amount: number;
  status: string;
  paymentGroup: string | null;
  paymentType: string | null;
  slipDocumentId: string | null;
  transactionDate: string;
  financePaidAt: string | null;
  items: Array<{ productType: string; productName: string; quantity: number; unitPrice: number; lineTotal: number }>;
}

export const OfflinePaymentReview = ({ id, role }: { id: string; role: "ADMIN" | "FINANCE" }) => {
  const [data, setData] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiFetch<PaymentDetail>(`/api/offline-payments/${id}`));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch(`/api/offline-payments/${id}/mark-paid`, { method: "PUT" });
      setMessage("Payment marked as paid.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const approve = async (decision: VerificationDecision, remarks: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch(`/api/offline-payments/${id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ decision, reason: remarks })
      });
      setMessage(`Payment ${decision}.`);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) return <LoadingState label="Loading payment..." />;

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-title">Purchase Header</h3>
            <Badge tone={data.status === "ORDER_CONFIRMED" ? "success" : data.status === "REJECTED" ? "danger" : "warning"}>
              {data.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Company" value={data.companyName} />
            <Info label="Account" value={data.accountCode || "-"} />
            <Info label="Reference No" value={data.reference} />
            <Info label="Transaction Date" value={formatDateTime(data.transactionDate)} />
            <Info label="Payment Group" value={data.paymentGroup || "-"} />
            <Info label="Payment Type" value={data.paymentType || "-"} />
            <Info label="Amount" value={formatCurrency(data.amount)} />
            <Info label="Finance Paid" value={data.financePaidAt ? formatDateTime(data.financePaidAt) : "Not yet"} />
          </div>
          {data.slipDocumentId ? (
            <a
              href={`/api/documents/${data.slipDocumentId}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-emerald-700"
            >
              View uploaded slip →
            </a>
          ) : null}
        </Card>

        <Card>
          <h3 className="section-title mb-3">Purchase Detail</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Product Type</th>
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Price</th>
                  <th className="px-2 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((i, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-2 py-2">{i.productType}</td>
                    <td className="px-2 py-2">{i.productName}</td>
                    <td className="px-2 py-2">{i.quantity}</td>
                    <td className="px-2 py-2">{formatCurrency(i.unitPrice)}</td>
                    <td className="px-2 py-2">{formatCurrency(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {role === "FINANCE" || role === "ADMIN" ? (
          <Card>
            <h3 className="section-title mb-2">Finance</h3>
            <p className="mb-3 text-xs text-slate-500">
              Mark the payment as paid (will not generate ticket). Required before admin approval.
            </p>
            <Button onClick={markPaid} disabled={busy || Boolean(data.financePaidAt)}>
              {data.financePaidAt ? "Already Marked Paid" : "Mark Payment Paid"}
            </Button>
          </Card>
        ) : null}

        {role === "ADMIN" && data.status === "PENDING_APPROVAL" ? (
          <StatusUpdatePanel
            title="Payment Approval"
            approveLabel="Approved"
            submitting={busy}
            onSubmit={approve}
          />
        ) : null}

        {message ? (
          <Card>
            <p className="text-sm text-slate-700">{message}</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);

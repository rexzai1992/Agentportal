"use client";

import { MouseEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading";
import { ReferenceLink } from "@/components/shared/transaction-detail-modal";
import { apiFetch } from "@/lib/fetcher";
import { formatStatusLabel, statusTone } from "@/lib/status";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface PaymentRow {
  id: string;
  reference: string;
  companyName: string;
  accountCode: string | null;
  amount: number;
  status: string;
  financePaidAt: string | null;
  createdAt: string;
}

export const OfflinePaymentList = ({
  status,
  basePath,
  canApprove
}: {
  status?: string;
  basePath: string;
  /** Show a one-click "Approve Payment" action on PENDING_APPROVAL rows (admin). */
  canApprove?: boolean;
}) => {
  const router = useRouter();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (status) sp.set("status", status);
      setRows(await apiFetch<PaymentRow[]>(`/api/offline-payments?${sp.toString()}`));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (e: MouseEvent, row: PaymentRow) => {
    e.stopPropagation();
    if (!window.confirm(`Approve payment ${row.reference}? This will confirm the order and issue vouchers.`)) {
      return;
    }
    setApprovingId(row.id);
    setNotice(null);
    try {
      await apiFetch(`/api/offline-payments/${row.id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ decision: "APPROVED" })
      });
      setNotice(`Payment ${row.reference} approved.`);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to approve payment.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Card>
      {notice ? (
        <p className="mb-3 rounded-xl bg-slate-50 p-2 text-sm text-slate-700">{notice}</p>
      ) : null}
      {loading ? (
        <LoadingState label="Loading payments..." />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No payments found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Reference No</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Finance Paid</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  onClick={() => router.push(`${basePath}/${row.id}`)}
                >
                  <td className="px-3 py-2">
                    <ReferenceLink reference={row.reference} />
                  </td>
                  <td className="px-3 py-2 text-slate-700">{row.companyName}</td>
                  <td className="px-3 py-2 text-slate-600">{formatCurrency(row.amount)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.financePaidAt ? formatDateTime(row.financePaidAt) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-start gap-1.5">
                      <Badge tone={statusTone(row.status)}>{formatStatusLabel(row.status)}</Badge>
                      {canApprove && row.status === "PENDING_APPROVAL" ? (
                        row.financePaidAt ? (
                          <Button
                            className="h-8 min-h-8 px-3 py-1 text-xs"
                            disabled={approvingId === row.id}
                            onClick={(e) => approve(e, row)}
                          >
                            {approvingId === row.id ? "Approving..." : "Approve Payment"}
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Awaiting finance</span>
                        )
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

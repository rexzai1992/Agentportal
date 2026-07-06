"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
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

const tone = (s: string) =>
  s === "ORDER_CONFIRMED" ? "success" : s === "REJECTED" ? "danger" : "warning";

export const OfflinePaymentList = ({
  status,
  basePath
}: {
  status?: string;
  basePath: string;
}) => {
  const router = useRouter();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Card>
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
                  <td className="px-3 py-2 font-semibold text-emerald-700">{row.reference}</td>
                  <td className="px-3 py-2 text-slate-700">{row.companyName}</td>
                  <td className="px-3 py-2 text-slate-600">{formatCurrency(row.amount)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.financePaidAt ? formatDateTime(row.financePaidAt) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={tone(row.status)}>{row.status.replace(/_/g, " ")}</Badge>
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

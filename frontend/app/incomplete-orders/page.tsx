"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading";
import { ReferenceLink } from "@/components/shared/transaction-detail-modal";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Order {
  orderReference: string;
  totalPayable: number;
  transactionDate: string;
  items: Array<{ productType: string }>;
}

export default function IncompleteOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<Order[]>("/api/purchases?status=PENDING_PAYMENT"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedShell roles={["AGENT"]} title="Incomplete Orders" subtitle="Orders awaiting payment">
      <Card>
        {loading ? (
          <LoadingState label="Loading orders..." />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No incomplete orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Reference No</th>
                  <th className="px-3 py-2">Transaction Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.orderReference} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      <ReferenceLink reference={row.orderReference} />
                    </td>
                    <td className="px-3 py-2 text-slate-600">{formatDateTime(row.transactionDate)}</td>
                    <td className="px-3 py-2 text-slate-600">{formatCurrency(row.totalPayable)}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/transaction-review/${row.orderReference}`}
                        className="inline-flex items-center rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                      >
                        Complete →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ProtectedShell>
  );
}

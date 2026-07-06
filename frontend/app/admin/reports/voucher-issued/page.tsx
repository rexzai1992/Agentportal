"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";

interface VoucherGroup {
  key: string;
  reference: string;
  companyName: string;
  productName: string;
  productType: string;
  issuedQty: number;
  usedQty: number;
  availableQty: number;
}

export default function AdminVoucherIssuedReportPage() {
  const [rows, setRows] = useState<VoucherGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<VoucherGroup[]>("/api/vouchers"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedShell roles={["ADMIN"]} title="Voucher Issued Report" subtitle="Issued vouchers">
      <Card>
        {loading ? (
          <LoadingState label="Loading..." />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No vouchers issued.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Issued</th>
                  <th className="px-3 py-2">Used</th>
                  <th className="px-3 py-2">Available</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{r.reference}</td>
                    <td className="px-3 py-2 text-slate-600">{r.companyName}</td>
                    <td className="px-3 py-2 text-slate-600">{r.productName}</td>
                    <td className="px-3 py-2">{r.issuedQty}</td>
                    <td className="px-3 py-2">{r.usedQty}</td>
                    <td className="px-3 py-2">{r.availableQty}</td>
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

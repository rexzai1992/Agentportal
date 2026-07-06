"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";

interface VoucherGroup {
  key: string;
  detailId: string | null;
  purchaseOrderId: string | null;
  reference: string;
  productName: string;
  productType: string;
  issuedQty: number;
  usedQty: number;
  availableQty: number;
}

export default function VouchersPage() {
  const [rows, setRows] = useState<VoucherGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (from) sp.set("from", from);
      if (to) sp.set("to", to);
      setRows(await apiFetch<VoucherGroup[]>(`/api/vouchers?${sp.toString()}`));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedShell roles={["AGENT"]} title="Voucher Issued" subtitle="Your issued vouchers">
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>
            Reset
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingState label="Loading vouchers..." />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No vouchers issued.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Product Type</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Issued</th>
                  <th className="px-3 py-2">Used</th>
                  <th className="px-3 py-2">Available</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{row.reference}</td>
                    <td className="px-3 py-2 text-slate-600">{row.productType}</td>
                    <td className="px-3 py-2 text-slate-600">{row.productName}</td>
                    <td className="px-3 py-2">{row.issuedQty}</td>
                    <td className="px-3 py-2">{row.usedQty}</td>
                    <td className="px-3 py-2">{row.availableQty}</td>
                    <td className="px-3 py-2">
                      {row.detailId ? (
                        <Link href={`/vouchers/${row.detailId}`} className="font-semibold text-emerald-700">
                          View QR
                        </Link>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
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

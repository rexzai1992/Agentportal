"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading";
import { StatusUpdatePanel, type VerificationDecision } from "@/components/shared/status-update-panel";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface Renewal {
  id: string;
  companyName: string;
  email: string;
  accountCode: string | null;
  licenseNo: string | null;
  kplExpiryDate: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION";
  remarks: string | null;
  modifiedDate: string;
}

const tone = (s: string) =>
  s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" : "warning";

export default function RenewalsPage() {
  const [rows, setRows] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Renewal | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<Renewal[]>("/api/renewals"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (decision: VerificationDecision, remarks: string) => {
    if (!active) return;
    setBusy(true);
    try {
      await apiFetch(`/api/renewals/${active.id}/verify`, {
        method: "PUT",
        body: JSON.stringify({ decision, remarks })
      });
      setActive(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Account Renewal" subtitle="Review renewal requests">
      <Card>
        {loading ? (
          <LoadingState label="Loading renewals..." />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No renewal requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">License No</th>
                  <th className="px-3 py-2">License Expiry</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Modified</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{row.companyName}</td>
                    <td className="px-3 py-2 text-slate-600">{row.email}</td>
                    <td className="px-3 py-2 text-slate-600">{row.licenseNo || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{row.kplExpiryDate ? formatDate(row.kplExpiryDate) : "-"}</td>
                    <td className="px-3 py-2">
                      <Badge tone={tone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(row.modifiedDate)}</td>
                    <td className="px-3 py-2">
                      {row.status === "PENDING" || row.status === "REVISION" ? (
                        <Button variant="ghost" className="h-9 px-3" onClick={() => setActive(row)}>
                          Review
                        </Button>
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

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={`Renewal · ${active?.companyName ?? ""}`}>
        {active ? <StatusUpdatePanel submitting={busy} onSubmit={verify} /> : null}
      </Modal>
    </ProtectedShell>
  );
}

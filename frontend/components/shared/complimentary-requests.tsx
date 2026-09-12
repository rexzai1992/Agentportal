"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/fetcher";

type Request = { id: string; companyName: string; quantity: number; status: string; reason: string | null;
  requestedBy: string; reviewedBy: string | null; reviewedAt: string | null; reviewRemarks: string | null;
  createdAt: string; issuedQuantity: number; items: { ticketTypeId: string; name: string; quantity: number }[] };

export function ComplimentaryRequests({ review = false, refreshKey = 0 }: { review?: boolean; refreshKey?: number }) {
  const [rows, setRows] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await apiFetch<Request[]>("/api/complimentary")); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load requests"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load, refreshKey]);
  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    if (busy) return;
    setBusy(id); setError(null); setMessage(null);
    try {
      await apiFetch(`/api/complimentary/${id}/review`, { method: "PUT", body: JSON.stringify({ decision, remarks: remarks[id] ?? "" }) });
      setMessage(decision === "APPROVED" ? "Request approved. Vouchers have been issued." : "Request rejected. No vouchers were issued.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to review request"); }
    finally { setBusy(null); }
  };
  return <Card>
    <div className="flex items-center justify-between"><h3 className="section-title">{review ? "Complimentary approvals" : "Request history"}</h3><Button variant="ghost" disabled={loading || Boolean(busy)} onClick={load}>Refresh</Button></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
    {loading ? <p className="py-4">Loading requests…</p> : !rows.length ? <p className="py-4 text-sm text-slate-500">No complimentary requests.</p> :
      <div className="mt-4 space-y-4">{[...rows].sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING")).map((row) => <div key={row.id} className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold">{row.companyName} · {row.quantity} tickets</h4><span className="text-sm font-semibold">{row.status}</span></div>
        <p className="mt-1 text-sm text-slate-600">Requested by {row.requestedBy} · {new Date(row.createdAt).toLocaleString()}</p>
        <p className="mt-2 text-sm">Reason: {row.reason || "Not provided"}</p>
        <ul className="mt-2 text-sm">{row.items.map((item) => <li key={item.ticketTypeId}>{item.name} × {item.quantity}</li>)}</ul>
        <p className="mt-2 text-sm">Vouchers issued: {row.issuedQuantity}</p>
        {row.reviewedBy && <p className="mt-2 text-sm text-slate-600">Reviewed by {row.reviewedBy}{row.reviewedAt ? ` · ${new Date(row.reviewedAt).toLocaleString()}` : ""}</p>}
        {row.reviewRemarks && <p className="mt-2 text-sm">Review remarks: {row.reviewRemarks}</p>}
        {review && row.status === "PENDING" && <div className="mt-4 space-y-3">
          <label className="block text-sm">Review remarks (required when rejecting)<Input aria-label={`Review remarks for ${row.id}`} value={remarks[row.id] ?? ""} disabled={Boolean(busy)} onChange={(e) => setRemarks({ ...remarks, [row.id]: e.target.value })} /></label>
          <div className="flex gap-2"><Button disabled={Boolean(busy)} onClick={() => decide(row.id, "APPROVED")}>Approve & issue vouchers</Button><Button variant="danger" disabled={Boolean(busy)} onClick={() => decide(row.id, "REJECTED")}>Reject</Button></div>
        </div>}
      </div>)}</div>}
  </Card>;
}

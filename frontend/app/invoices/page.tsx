"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceType: "WEEKLY" | "MONTHLY";
  periodStart: string;
  periodEnd: string;
  totalSales: number | string;
  totalCommission: number | string;
  totalPayable: number | string;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  dueDate: string;
  paidAt?: string | null;
  agent?: {
    companyName: string;
  } | null;
}

const toneByStatus: Record<InvoiceItem["status"], "default" | "success" | "warning" | "danger"> = {
  DRAFT: "default",
  ISSUED: "warning",
  PAID: "success",
  OVERDUE: "danger"
};

export default function InvoicesPage() {
  const { user } = useSession(["ADMIN", "AGENT"]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = status ? `?status=${status}` : "";
      const data = await apiFetch<InvoiceItem[]>(`/api/invoices${query}`);
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invoices");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const generateInvoices = async () => {
    setBusyId("generate");
    setError(null);
    try {
      await apiFetch<InvoiceItem[]>("/api/invoices/generate", {
        method: "POST",
        body: JSON.stringify({})
      });
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate invoices");
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch<InvoiceItem>(`/api/invoices/${id}/pay`, { method: "PUT" });
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update invoice");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ProtectedShell
      roles={["ADMIN", "AGENT"]}
      title="Invoices"
      subtitle="Track cycle billing, due dates and payment settlement"
    >
      <section className="bento-grid lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h3 className="section-title">Filters</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </Select>
            <Button variant="secondary" onClick={loadInvoices}>
              Refresh
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">Actions</h3>
          {user?.role === "ADMIN" ? (
            <Button className="mt-3 w-full" onClick={generateInvoices} disabled={busyId === "generate"}>
              {busyId === "generate" ? <Skeleton className="h-4 w-36 bg-white/70" /> : "Generate New Invoices"}
            </Button>
          ) : (
            <p className="muted mt-3">Agents can view invoice status but cannot generate cycles.</p>
          )}
        </Card>
      </section>

      <Card>
        <h3 className="section-title">Invoice List</h3>
        {loading ? (
          <LoadingState label="Loading invoices..." />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Invoice</th>
                  <th className="px-2 py-2">Agent</th>
                  <th className="px-2 py-2">Period</th>
                  <th className="px-2 py-2">Payable</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Due / Paid</th>
                  {user?.role === "ADMIN" ? <th className="px-2 py-2">Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <p className="font-semibold text-slate-800">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{invoice.invoiceType}</p>
                    </td>
                    <td className="px-2 py-2 text-slate-700">{invoice.agent?.companyName ?? "-"}</td>
                    <td className="px-2 py-2 text-xs text-slate-500">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </td>
                    <td className="px-2 py-2 font-semibold text-slate-800">
                      {formatCurrency(Number(invoice.totalPayable))}
                    </td>
                    <td className="px-2 py-2">
                      <Badge tone={toneByStatus[invoice.status]}>{invoice.status}</Badge>
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-500">
                      <p>Due: {formatDate(invoice.dueDate)}</p>
                      <p>Paid: {invoice.paidAt ? formatDateTime(invoice.paidAt) : "-"}</p>
                    </td>
                    {user?.role === "ADMIN" ? (
                      <td className="px-2 py-2">
                        <Button
                          variant="ghost"
                          onClick={() => markPaid(invoice.id)}
                          disabled={invoice.status === "PAID" || busyId === invoice.id}
                        >
                          {invoice.status === "PAID"
                            ? "Paid"
                            : busyId === invoice.id
                              ? <Skeleton className="h-4 w-16" />
                              : "Mark Paid"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {!invoices.length ? <p className="muted px-2 py-4">No invoices found for this filter.</p> : null}
          </div>
        )}
      </Card>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </ProtectedShell>
  );
}

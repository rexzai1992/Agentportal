"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { downloadFile } from "@/lib/download";
import { formatDate, formatDateTime } from "@/lib/utils";

interface TicketItem {
  id: string;
  ticketCode: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
  visitDate: string;
  checkedInAt?: string | null;
  booking?: {
    bookingReference: string;
    customerName: string;
  } | null;
  ticketType?: {
    name: string;
  } | null;
}

interface TicketQrResponse {
  payload: {
    ticketId: string;
    qrToken: string;
    signature: string;
    ts: number;
  };
  dataUrl: string;
}

const toneByStatus: Record<TicketItem["status"], "default" | "success" | "warning" | "danger"> = {
  ACTIVE: "default",
  USED: "success",
  EXPIRED: "warning",
  CANCELLED: "danger"
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [bookingReference, setBookingReference] = useState("");
  const [debouncedBookingReference, setDebouncedBookingReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [qrPreview, setQrPreview] = useState<{ code: string; dataUrl: string } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedBookingReference(bookingReference.trim());
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [bookingReference]);

  const loadTickets = useCallback(async (overrideBookingReference?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      const effectiveBookingReference =
        typeof overrideBookingReference === "string"
          ? overrideBookingReference.trim()
          : debouncedBookingReference;

      if (status) params.set("status", status);
      if (effectiveBookingReference) params.set("bookingReference", effectiveBookingReference);

      const query = params.toString();
      const data = await apiFetch<TicketItem[]>(`/api/tickets${query ? `?${query}` : ""}`);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedBookingReference]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const exportExcel = async () => {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (debouncedBookingReference) params.set("bookingReference", debouncedBookingReference);
      params.set("format", "xlsx");
      await downloadFile(`/api/tickets?${params.toString()}`, undefined, "tickets.xlsx");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export tickets");
    } finally {
      setExporting(false);
    }
  };

  const openQr = async (ticketId: string, ticketCode: string) => {
    try {
      const qr = await apiFetch<TicketQrResponse>(`/api/tickets/${ticketId}/qr`);
      setQrPreview({ code: ticketCode, dataUrl: qr.dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load QR");
    }
  };

  return (
    <ProtectedShell
      roles={["ADMIN", "AGENT", "STAFF"]}
      title="Tickets"
      subtitle="Search and monitor ticket status with instant QR preview"
    >
      <section className="bento-grid lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h3 className="section-title">Ticket Filters</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
            <Input
              placeholder="Booking reference"
              value={bookingReference}
              onChange={(event) => setBookingReference(event.target.value)}
            />
            <Button onClick={() => loadTickets(bookingReference)}>Refresh</Button>
          </div>
          <div className="mt-3">
            <Button variant="ghost" onClick={exportExcel} disabled={exporting}>
              {exporting ? "Exporting..." : "Export To Excel"}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">QR Preview</h3>
          {qrPreview ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-slate-800">{qrPreview.code}</p>
              <Image
                src={qrPreview.dataUrl}
                alt="Ticket QR"
                width={460}
                height={460}
                unoptimized
                className="h-auto w-full rounded-2xl ring-1 ring-slate-200"
              />
            </div>
          ) : (
            <p className="muted mt-3">Select a ticket and click View QR.</p>
          )}
        </Card>
      </section>

      <Card>
        <h3 className="section-title">Tickets</h3>
        {loading ? (
          <LoadingState label="Loading tickets..." />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Ticket</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Booking</th>
                  <th className="px-2 py-2">Visit Date</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Check-In</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-semibold text-slate-800">{ticket.ticketCode}</td>
                    <td className="px-2 py-2 text-slate-600">{ticket.ticketType?.name ?? "-"}</td>
                    <td className="px-2 py-2">
                      <p className="font-semibold text-slate-800">{ticket.booking?.bookingReference ?? "-"}</p>
                      <p className="text-xs text-slate-500">{ticket.booking?.customerName ?? "-"}</p>
                    </td>
                    <td className="px-2 py-2 text-slate-600">{formatDate(ticket.visitDate)}</td>
                    <td className="px-2 py-2">
                      <Badge tone={toneByStatus[ticket.status]}>{ticket.status}</Badge>
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-500">
                      {ticket.checkedInAt ? formatDateTime(ticket.checkedInAt) : "-"}
                    </td>
                    <td className="px-2 py-2">
                      <Button variant="ghost" onClick={() => openQr(ticket.id, ticket.ticketCode)}>
                        View QR
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!tickets.length ? <p className="muted px-2 py-4">No tickets found for this filter.</p> : null}
          </div>
        )}
      </Card>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </ProtectedShell>
  );
}

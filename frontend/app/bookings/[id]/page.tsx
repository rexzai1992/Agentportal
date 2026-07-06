"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BookingDetails {
  id: string;
  bookingReference: string;
  customerName: string;
  customerPhone?: string | null;
  paymentStatus: "PREPAID_PAID" | "UNBILLED" | "INVOICED" | "PAID";
  subtotal: number | string;
  totalCommission: number | string;
  totalPayable: number | string;
  totalTickets: number;
  createdAt: string;
  agent?: {
    companyName: string;
  } | null;
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
    visitDate: string;
    ticketType?: {
      name: string;
    } | null;
  }>;
}

interface TicketQrResponse {
  dataUrl: string;
}

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<{ code: string; dataUrl: string } | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!params?.id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<BookingDetails>(`/api/bookings/${params.id}`);
        setBooking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load booking details");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params?.id]);

  const previewQr = async (ticketId: string, code: string) => {
    try {
      const qr = await apiFetch<TicketQrResponse>(`/api/tickets/${ticketId}/qr`);
      setQrPreview({ code, dataUrl: qr.dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ticket QR");
    }
  };

  return (
    <ProtectedShell
      roles={["ADMIN", "AGENT"]}
      title="Booking Details"
      subtitle="Review customer info, payment summary and issued tickets"
    >
      {loading || !booking ? (
        <LoadingState label="Loading booking details..." />
      ) : (
        <>
          <section className="bento-grid lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h3 className="section-title">Booking Summary</h3>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-700">Reference:</span> {booking.bookingReference}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Created:</span> {formatDate(booking.createdAt)}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Customer:</span> {booking.customerName}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Phone:</span> {booking.customerPhone || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Agent:</span> {booking.agent?.companyName ?? "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Tickets:</span> {booking.totalTickets}
                </p>
              </div>

              <div className="mt-3">
                <Badge tone={booking.paymentStatus === "PAID" || booking.paymentStatus === "PREPAID_PAID" ? "success" : "warning"}>
                  {booking.paymentStatus}
                </Badge>
              </div>
            </Card>

            <Card>
              <h3 className="section-title">Payment</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(Number(booking.subtotal))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Commission</span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(Number(booking.totalCommission))}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="font-semibold text-slate-700">Net Payable</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(Number(booking.totalPayable))}</span>
                </div>
              </div>
            </Card>
          </section>

          <section className="bento-grid lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h3 className="section-title">Issued Tickets</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Visit Date</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 font-semibold text-slate-800">{ticket.ticketCode}</td>
                        <td className="px-2 py-2 text-slate-600">{ticket.ticketType?.name ?? "-"}</td>
                        <td className="px-2 py-2 text-slate-600">{formatDate(ticket.visitDate)}</td>
                        <td className="px-2 py-2">
                          <Badge
                            tone={
                              ticket.status === "USED"
                                ? "success"
                                : ticket.status === "ACTIVE"
                                  ? "default"
                                  : "danger"
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </td>
                        <td className="px-2 py-2">
                          <Button variant="ghost" onClick={() => previewQr(ticket.id, ticket.ticketCode)}>
                            View QR
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <p className="muted mt-3">Select any ticket to preview QR.</p>
              )}
            </Card>
          </section>
        </>
      )}

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </ProtectedShell>
  );
}

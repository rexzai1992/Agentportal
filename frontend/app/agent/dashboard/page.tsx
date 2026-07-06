"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AnnouncementItem {
  id: string;
  title: string;
  body: string | null;
}
interface AgentPortalStats {
  pendingApproval: number;
  incompleteOrders: number;
  todaysPurchases: number;
}

const AgentPortalSection = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [stats, setStats] = useState<AgentPortalStats | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    apiFetch<AnnouncementItem[]>("/api/announcements/active?displayType=HOME")
      .then((data) => {
        setAnnouncements(data);
        if (data.length > 0) setPopupOpen(true);
      })
      .catch(() => setAnnouncements([]));
    apiFetch<AgentPortalStats>("/api/agent/dashboard").then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <>
      {announcements.length > 0 ? (
        <Card>
          <h3 className="section-title mb-2">Latest Announcement</h3>
          <ul className="space-y-1 text-sm">
            {announcements.map((a) => (
              <li key={a.id} className="text-slate-700">
                + {a.title}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {stats ? (
        <section className="bento-grid sm:grid-cols-3">
          <StatCard label="Pending Approvals" value={String(stats.pendingApproval)} tone="warning" />
          <StatCard label="Incomplete Orders" value={String(stats.incompleteOrders)} />
          <StatCard label="Today's Purchases" value={String(stats.todaysPurchases)} />
        </section>
      ) : null}

      <Modal open={popupOpen} onClose={() => setPopupOpen(false)} title="Latest Announcement">
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl bg-slate-50 p-3">
              <p className="font-semibold text-slate-800">{a.title}</p>
              {a.body ? <p className="mt-1 text-sm text-slate-600">{a.body}</p> : null}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

interface AgentDashboardResponse {
  role: "AGENT";
  agreementType: "PREPAID" | "WEEKLY" | "MONTHLY";
  stats: {
    creditBalance: number;
    outstandingBalance: number;
    ticketsSoldToday: number;
    totalTicketsSold: number;
    commissionEarned: number;
    lowBalanceWarning: boolean;
    nextInvoiceDate?: string | null;
  };
  recentBookings: Array<{
    id: string;
    bookingReference: string;
    customerName: string;
    totalPayable: number;
    totalTickets: number;
    createdAt: string;
  }>;
  recentTickets: Array<{
    id: string;
    ticketCode: string;
    status: string;
    visitDate: string;
    booking: {
      bookingReference: string;
      customerName: string;
    };
    ticketType: {
      name: string;
    };
  }>;
}

export default function AgentDashboardPage() {
  const [data, setData] = useState<AgentDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiFetch<AgentDashboardResponse>("/api/dashboard")
      .then((result) => {
        if (!mounted) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
        setData(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ProtectedShell
      roles={["AGENT"]}
      title="Agent Dashboard"
      subtitle="Track bookings, commissions, balances, and ticket activity"
    >
      <AgentPortalSection />
      {error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : !data ? (
        <LoadingState label="Loading agent dashboard..." />
      ) : (
        <>
          {data.agreementType === "PREPAID" ? (
            <section className="bento-grid sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Current Credit Balance" value={formatCurrency(data.stats.creditBalance)} />
              <StatCard label="Tickets Sold Today" value={String(data.stats.ticketsSoldToday)} />
              <StatCard label="Commission Earned" value={formatCurrency(data.stats.commissionEarned)} />
              <StatCard
                label="Balance Status"
                value={data.stats.lowBalanceWarning ? "Low Balance" : "Healthy"}
                tone={data.stats.lowBalanceWarning ? "warning" : "success"}
              />
            </section>
          ) : (
            <section className="bento-grid sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Outstanding Amount" value={formatCurrency(data.stats.outstandingBalance)} tone="warning" />
              <StatCard
                label="Next Invoice Date"
                value={data.stats.nextInvoiceDate ? formatDate(data.stats.nextInvoiceDate) : "-"}
              />
              <StatCard label="Total Tickets Sold" value={String(data.stats.totalTicketsSold)} />
              <StatCard label="Commission Earned" value={formatCurrency(data.stats.commissionEarned)} />
            </section>
          )}

          <section className="bento-grid xl:grid-cols-2">
            <Card>
              <h3 className="section-title">Recent Bookings</h3>
              <div className="mt-3 space-y-2">
                {data.recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-slate-200 transition hover:bg-emerald-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{booking.bookingReference}</p>
                      <p className="text-xs text-slate-500">{booking.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(Number(booking.totalPayable))}</p>
                      <p className="text-xs text-slate-500">{formatDate(booking.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="section-title">Recent Tickets</h3>
              <div className="mt-3 space-y-2">
                {data.recentTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{ticket.ticketCode}</p>
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
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{ticket.ticketType.name}</p>
                    <p className="text-xs text-slate-500">Visit: {formatDate(ticket.visitDate)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}
    </ProtectedShell>
  );
}

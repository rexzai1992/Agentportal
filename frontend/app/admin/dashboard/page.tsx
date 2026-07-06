"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/utils";

interface PortalCounts {
  pendingAgent: number;
  pendingPartner: number;
  totalAgents: number;
  totalPartners: number;
  pendingPayments: number;
}

const PORTAL_CARDS: Array<{ key: keyof PortalCounts; label: string; href: string }> = [
  { key: "pendingAgent", label: "Pending Agent Requests", href: "/admin/registrations/agents" },
  { key: "pendingPartner", label: "Pending Partner Requests", href: "/admin/registrations/partners" },
  { key: "totalAgents", label: "Total Agents", href: "/admin/agents-active" },
  { key: "totalPartners", label: "Total Partners", href: "/admin/partners-active" },
  { key: "pendingPayments", label: "Pending Payment Approvals", href: "/admin/offline-payments/pending" }
];

const PortalSummary = () => {
  const [counts, setCounts] = useState<PortalCounts | null>(null);
  useEffect(() => {
    apiFetch<PortalCounts>("/api/admin/summary").then(setCounts).catch(() => setCounts(null));
  }, []);
  if (!counts) return null;
  return (
    <section className="bento-grid sm:grid-cols-2 xl:grid-cols-5">
      {PORTAL_CARDS.map((card) => (
        <Link key={card.key} href={card.href}>
          <StatCard label={card.label} value={String(counts[card.key])} />
        </Link>
      ))}
    </section>
  );
};

const ChartFallback = () => (
  <Card>
    <div className="section-title">Loading chart...</div>
    <div className="mt-3 h-64 animate-pulse rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
  </Card>
);

const SalesLineChart = dynamic(
  () => import("@/components/dashboard/charts").then((mod) => mod.SalesLineChart),
  {
    ssr: false,
    loading: () => <ChartFallback />
  }
);

const SalesBarChart = dynamic(
  () => import("@/components/dashboard/charts").then((mod) => mod.SalesBarChart),
  {
    ssr: false,
    loading: () => <ChartFallback />
  }
);

interface DashboardResponse {
  role: "ADMIN";
  summary: {
    totalRevenue: number;
    totalTicketsSold: number;
    ticketsUsedToday: number;
    outstandingInvoices: number;
    activeAgents: number;
  };
  charts: {
    dailySales: Array<{ date: string; sales: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    topAgents: Array<{ agent: string; sales: number }>;
    usageByDay: Array<{ date: string; used: number }>;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiFetch<DashboardResponse>("/api/dashboard")
      .then((result) => {
        if (!mounted) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
        setData(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ProtectedShell
      roles={["ADMIN"]}
      title="Admin Dashboard"
      subtitle="Monitor revenue, ticket movement, settlements, and agent performance"
    >
      <PortalSummary />
      {error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : loading || !data ? (
        <LoadingState label="Loading dashboard metrics..." />
      ) : (
        <>
          <section className="bento-grid sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Revenue" value={formatCurrency(data.summary.totalRevenue)} tone="success" />
            <StatCard label="Tickets Sold" value={String(data.summary.totalTicketsSold)} />
            <StatCard label="Used Today" value={String(data.summary.ticketsUsedToday)} />
            <StatCard
              label="Outstanding Invoices"
              value={String(data.summary.outstandingInvoices)}
              tone={data.summary.outstandingInvoices > 0 ? "warning" : "default"}
            />
            <StatCard label="Active Agents" value={String(data.summary.activeAgents)} />
          </section>

          <section className="bento-grid xl:grid-cols-12">
            <div className="xl:col-span-8">
              <SalesLineChart title="Daily Sales" data={data.charts.dailySales} dataKey="sales" />
            </div>
            <div className="xl:col-span-4">
              <SalesBarChart
                title="Top Agents by Sales"
                data={data.charts.topAgents}
                dataKey="sales"
                xKey="agent"
              />
            </div>
            <div className="xl:col-span-6">
              <SalesLineChart
                title="Ticket Usage by Day"
                data={data.charts.usageByDay}
                dataKey="used"
              />
            </div>
            <div className="xl:col-span-6">
              <SalesBarChart
                title="Monthly Revenue"
                data={data.charts.monthlyRevenue}
                dataKey="revenue"
                xKey="month"
              />
            </div>
          </section>

          <Card>
            <h3 className="section-title">Settlement Notes</h3>
            <p className="mt-2 text-sm text-slate-600">
              Weekly and monthly settlement records are handled through finance workflows. Prepaid deductions
              are applied instantly at purchase time.
            </p>
          </Card>
        </>
      )}
    </ProtectedShell>
  );
}

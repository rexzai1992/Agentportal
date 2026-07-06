"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

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

interface SalesReport {
  totals: {
    sales: number;
    commission: number;
    payable: number;
    tickets: number;
  };
  daily: Array<{ date: string; sales: number; commission: number; payable: number; tickets: number }>;
}

interface UsageReport {
  total: number;
  byStatus: Record<string, number>;
}

interface CommissionReport {
  byAgent: Array<{ agentId: string; agentName: string; commission: number; sales: number }>;
}

interface AgentPerformanceReport {
  agents: Array<{
    agentId: string;
    agentName: string;
    totalSales: number;
    totalCommission: number;
    totalTickets: number;
    bookings: number;
  }>;
}

export default function ReportsPage() {
  const { user } = useSession(["ADMIN", "AGENT"]);
  const userRole = user?.role;
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [commission, setCommission] = useState<CommissionReport | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformanceReport | null>(null);

  const loadReports = useCallback(async () => {
    if (!userRole) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = `?range=${range}`;
      const [salesData, usageData, commissionData] = await Promise.all([
        apiFetch<SalesReport>(`/api/reports/sales${query}`),
        apiFetch<UsageReport>(`/api/reports/usage${query}`),
        apiFetch<CommissionReport>(`/api/reports/commission${query}`)
      ]);

      setSales(salesData);
      setUsage(usageData);
      setCommission(commissionData);

      if (userRole === "ADMIN") {
        const agentData = await apiFetch<AgentPerformanceReport>(`/api/reports/agents${query}`);
        setAgentPerformance(agentData);
      } else {
        setAgentPerformance(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load report data");
    } finally {
      setLoading(false);
    }
  }, [range, userRole]);

  useEffect(() => {
    if (!userRole) {
      return;
    }

    loadReports();
  }, [loadReports, userRole]);

  return (
    <ProtectedShell
      roles={["ADMIN", "AGENT"]}
      title="Reports"
      subtitle="Review sales, commission and ticket usage in bento insights"
    >
      <Card>
        <h3 className="section-title">Report Range</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Select value={range} onChange={(event) => setRange(event.target.value)}>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </Select>
          <Button variant="secondary" onClick={loadReports}>
            Refresh Reports
          </Button>
        </div>
      </Card>

      {loading || !sales || !usage || !commission ? (
        <LoadingState label="Loading reports..." />
      ) : (
        <>
          <section className="bento-grid sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Sales" value={formatCurrency(sales.totals.sales)} tone="success" />
            <StatCard label="Commission" value={formatCurrency(sales.totals.commission)} />
            <StatCard label="Net Payable" value={formatCurrency(sales.totals.payable)} tone="warning" />
            <StatCard label="Tickets" value={String(sales.totals.tickets)} />
          </section>

          <section className="bento-grid xl:grid-cols-12">
            <div className="xl:col-span-8">
              <SalesLineChart title="Daily Sales" data={sales.daily} dataKey="sales" />
            </div>
            <div className="xl:col-span-4">
              <SalesBarChart
                title="Ticket Usage Status"
                data={Object.entries(usage.byStatus).map(([status, count]) => ({ status, count }))}
                dataKey="count"
                xKey="status"
              />
            </div>
            <div className="xl:col-span-6">
              <SalesBarChart title="Commission by Agent" data={commission.byAgent} dataKey="commission" xKey="agentName" />
            </div>
            {userRole === "ADMIN" && agentPerformance ? (
              <div className="xl:col-span-6">
                <SalesBarChart
                  title="Agent Performance (Sales)"
                  data={agentPerformance.agents.map((item) => ({ agent: item.agentName, sales: item.totalSales }))}
                  dataKey="sales"
                  xKey="agent"
                />
              </div>
            ) : null}
          </section>
        </>
      )}

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </ProtectedShell>
  );
}

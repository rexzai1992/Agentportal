"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/fetcher";
import { downloadFile } from "@/lib/download";
import { formatStatusLabel, statusTone } from "@/lib/status";
import { ReferenceLink } from "@/components/shared/transaction-detail-modal";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export interface ReportColumn {
  key: string;
  label: string;
  type?: "text" | "currency" | "date" | "datetime" | "status" | "reference";
}

interface UserOption {
  id: string;
  companyName: string;
  accountCode: string | null;
}

interface ReportShellProps {
  endpoint: string; // e.g. /api/reports/purchase
  columns: ReportColumn[];
  fileName: string;
  /** Show Filter By User + Filter By Company dropdowns (admin reports). */
  showUserFilters?: boolean;
  extraParams?: Record<string, string>;
}

const PAGE_SIZES = [15, 30, 50, 100];

export const ReportShell = ({ endpoint, columns, fileName, showUserFilters, extraParams }: ReportShellProps) => {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [agentId, setAgentId] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const buildQuery = useCallback(() => {
    const sp = new URLSearchParams();
    Object.entries(extraParams ?? {}).forEach(([key, value]) => {
      if (value) sp.set(key, value);
    });
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (agentId) sp.set("agentId", agentId);
    return sp;
  }, [from, to, agentId, extraParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<Record<string, unknown>[]>(`${endpoint}?${buildQuery().toString()}`));
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [endpoint, buildQuery]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showUserFilters) return;
    apiFetch<UserOption[]>("/api/complimentary/users")
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [showUserFilters]);

  const reset = () => {
    setFrom("");
    setTo("");
    setAgentId("");
    setSearch("");
    setPage(1);
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const sp = buildQuery();
      sp.set("format", "xlsx");
      await downloadFile(`${endpoint}?${sp.toString()}`, undefined, fileName);
    } finally {
      setExporting(false);
    }
  };

  const isStatusColumn = (col: ReportColumn) =>
    col.type === "status" || col.key.toLowerCase() === "status" || col.key.toLowerCase().endsWith("status");

  const render = (col: ReportColumn, value: unknown) => {
    if (value === null || value === undefined || value === "") return "-";
    if (col.type === "reference") return <ReferenceLink reference={String(value)} />;
    if (col.type === "currency") return formatCurrency(Number(value));
    if (col.type === "date") return formatDate(String(value));
    if (col.type === "datetime") return formatDateTime(String(value));
    if (isStatusColumn(col)) {
      const status = String(value);
      return <Badge tone={statusTone(status)}>{formatStatusLabel(status)}</Badge>;
    }
    return String(value).replace(/_/g, " ");
  };

  // Quick search across all columns (client-side)
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(term))
    );
  }, [rows, columns, search]);

  // TOTAL row across the filtered set for currency columns
  const totals = useMemo(() => {
    const sums: Record<string, number> = {};
    for (const c of columns) {
      if (c.type !== "currency") continue;
      sums[c.key] = filtered.reduce((acc, row) => acc + (Number(row[c.key]) || 0), 0);
    }
    return sums;
  }, [filtered, columns]);
  const hasTotals = Object.keys(totals).length > 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  return (
    <>
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {showUserFilters ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Filter By User</label>
                <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                  <option value="">All</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.accountCode ?? u.companyName}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Filter By Company</label>
                <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                  <option value="">All</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.companyName}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter By Date From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter By Date To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
          <Button onClick={load}>Search</Button>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="w-auto"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                Show {n} rows
              </option>
            ))}
          </Select>
          <Button variant="ghost" onClick={exportExcel} disabled={exporting}>
            {exporting ? "Exporting..." : "Export To Excel"}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-slate-600">Search:</label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56"
            />
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading report..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className="px-3 py-2">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    visible.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        {columns.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-slate-700">
                            {render(c, row[c.key])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
                {hasTotals ? (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                      {columns.map((c, i) => (
                        <td key={c.key} className="px-3 py-2">
                          {c.type === "currency"
                            ? formatCurrency(totals[c.key] ?? 0)
                            : i === 0
                              ? "TOTAL"
                              : ""}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>
                Showing {filtered.length === 0 ? 0 : start + 1} to{" "}
                {Math.min(start + pageSize, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="h-9 px-3"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center rounded-lg bg-emerald-50 px-3 text-emerald-700">
                  {safePage}
                </span>
                <Button
                  variant="ghost"
                  className="h-9 px-3"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
};

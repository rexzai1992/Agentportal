"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface AccountRow {
  id: string;
  accountCode: string | null;
  companyName: string;
  email: string;
  kplExpiryDate: string | null;
  accountExpiry: string | null;
  registrationStatus: string;
  accountStatus: "ACTIVE" | "INACTIVE" | "EXPIRED";
}

const tone = (s: string) => (s === "ACTIVE" ? "success" : s === "EXPIRED" ? "danger" : "default");

export const AccountList = ({ partyType }: { partyType: "AGENT" | "PARTNER" }) => {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ partyType });
      if (debounced) sp.set("search", debounced);
      const data = await apiFetch<AccountRow[]>(`/api/accounts?${sp.toString()}`);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [partyType, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <Input
        placeholder="Search company, email, account code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-xs"
      />
      {loading ? (
        <LoadingState label="Loading accounts..." />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No accounts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Account Code</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">KPL Expiry</th>
                <th className="px-3 py-2">Account Expiry</th>
                <th className="px-3 py-2">Registration</th>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.accountCode || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{row.companyName}</td>
                  <td className="px-3 py-2 text-slate-600">{row.email}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.kplExpiryDate ? formatDate(row.kplExpiryDate) : "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.accountExpiry ? formatDate(row.accountExpiry) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={row.registrationStatus === "APPROVED" ? "success" : "warning"}>
                      {row.registrationStatus}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={tone(row.accountStatus)}>{row.accountStatus}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/accounts/${row.id}`}
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

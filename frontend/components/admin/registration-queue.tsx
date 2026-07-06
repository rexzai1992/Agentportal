"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface RegistrationRow {
  id: string;
  applicationId: string;
  companyName: string;
  email: string;
  address: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION";
  createdAt: string;
}

const tone: Record<RegistrationRow["status"], "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REVISION: "warning"
};

export const RegistrationQueue = ({ partyType }: { partyType: "AGENT" | "PARTNER" }) => {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
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
      if (status) sp.set("status", status);
      if (debounced) sp.set("search", debounced);
      const data = await apiFetch<RegistrationRow[]>(`/api/registrations?${sp.toString()}`);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [partyType, status, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search company, email, application id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVISION">Revision</option>
          <option value="REJECTED">Rejected</option>
          <option value="APPROVED">Approved</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading requests..." />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Application Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.companyName}</td>
                  <td className="px-3 py-2 text-slate-600">{row.address}</td>
                  <td className="px-3 py-2 text-slate-600">{row.email}</td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(row.createdAt)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={tone[row.status]}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/registrations/${row.id}`}
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Review
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

"use client";

import { FormEvent, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/fetcher";
import { downloadFile } from "@/lib/download";
import { formatDate, formatDateTime } from "@/lib/utils";

interface TicketRow {
  username: string;
  companyName: string;
  reference: string;
  serialNo: string;
  effectiveDate: string;
  expiryDate: string;
  productType: string;
  productName: string;
  usedQuantity: number;
  entryDate: string | null;
  status: "NEW" | "LOCKED" | "REDEEMED" | "EXPIRED";
}

const tone = (s: string) =>
  s === "REDEEMED" ? "success" : s === "LOCKED" ? "warning" : s === "EXPIRED" ? "danger" : "default";

export default function TicketReportPage() {
  const [serial, setSerial] = useState("");
  const [qr, setQr] = useState("");
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const buildQuery = () => {
    const sp = new URLSearchParams();
    if (serial.trim()) sp.set("serial", serial.trim());
    if (qr.trim()) sp.set("qr", qr.trim());
    return sp;
  };

  const onSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      setRows(await apiFetch<TicketRow[]>(`/api/reports/ticket?${buildQuery().toString()}`));
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const sp = buildQuery();
      sp.set("format", "xlsx");
      await downloadFile(`/api/reports/ticket?${sp.toString()}`, undefined, "ticket-report.xlsx");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Ticket Report" subtitle="Search a ticket by serial no or QR code">
      <Card className="mb-4">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSearch}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ticket Serial No.</label>
            <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="e.g. APM-V-26-123456_001" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">QR Code</label>
            <Input value={qr} onChange={(e) => setQr(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSerial("");
                setQr("");
                setRows([]);
                setSearched(false);
              }}
            >
              Reset
            </Button>
            {rows.length > 0 ? (
              <Button type="button" variant="ghost" onClick={exportExcel} disabled={exporting}>
                {exporting ? "Exporting..." : "Export To Excel"}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card>
        {!searched ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Enter a ticket serial no or QR code and click Search.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No data available in table</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Company Name</th>
                  <th className="px-3 py-2">Reference No.</th>
                  <th className="px-3 py-2">Ticket Serial No.</th>
                  <th className="px-3 py-2">Effective Date</th>
                  <th className="px-3 py-2">Expiry Date</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Used Qty</th>
                  <th className="px-3 py-2">Entry Date</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.serialNo} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{row.username}</td>
                    <td className="px-3 py-2 text-slate-700">{row.companyName}</td>
                    <td className="px-3 py-2 text-slate-600">{row.reference}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.serialNo}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(row.effectiveDate)}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(row.expiryDate)}</td>
                    <td className="px-3 py-2 text-slate-600">{row.productName}</td>
                    <td className="px-3 py-2">{row.usedQuantity}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.entryDate ? formatDateTime(row.entryDate) : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={tone(row.status)}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ProtectedShell>
  );
}

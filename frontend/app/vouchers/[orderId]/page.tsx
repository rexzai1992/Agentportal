"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { downloadFile } from "@/lib/download";
import { formatDate } from "@/lib/utils";

interface VoucherDetail {
  reference: string;
  productName?: string;
  issuedQty: number;
  usedQty: number;
  availableQty: number;
  effectiveDate?: string;
  expiryDate?: string;
  vouchers: Array<{
    id: string;
    serialNo: string;
    qrToken: string;
    redeemStatus: "NEW" | "LOCKED" | "REDEEMED" | "EXPIRED";
    effectiveDate: string;
    expiryDate: string;
    redeemedAt: string | null;
    entranceGate: string | null;
  }>;
}

const tone = (s: string) =>
  s === "REDEEMED" ? "success" : s === "LOCKED" ? "warning" : s === "EXPIRED" ? "danger" : "default";

export default function VoucherDetailPage() {
  const params = useParams<{ orderId: string }>();
  const [data, setData] = useState<VoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrPreview, setQrPreview] = useState<{ serialNo: string; dataUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiFetch<VoucherDetail>(`/api/vouchers/${params.orderId}`));
    } finally {
      setLoading(false);
    }
  }, [params.orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredVouchers = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.vouchers.filter((v) => {
      if (statusFilter && v.redeemStatus !== statusFilter) return false;
      if (term && !v.serialNo.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, search, statusFilter]);

  const exportExcel = async () => {
    setExporting(true);
    setError(null);
    try {
      await downloadFile(
        `/api/vouchers/${params.orderId}?format=xlsx`,
        undefined,
        "voucher-detail.xlsx"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const openQr = async (voucher: VoucherDetail["vouchers"][number]) => {
    setError(null);
    try {
      const dataUrl = await QRCode.toDataURL(voucher.qrToken, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 460
      });
      setQrPreview({ serialNo: voucher.serialNo, dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate voucher QR");
    }
  };

  return (
    <ProtectedShell roles={["AGENT"]} title="Voucher Detail" subtitle="Issued voucher list">
      {loading || !data ? (
        <LoadingState label="Loading vouchers..." />
      ) : (
        <div className="space-y-4">
          <Card>
            <h3 className="section-title mb-3">Voucher Issued Header</h3>
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-slate-500">Reference</p><p className="font-semibold">{data.reference}</p></div>
              <div><p className="text-xs text-slate-500">Issued</p><p className="font-semibold">{data.issuedQty}</p></div>
              <div><p className="text-xs text-slate-500">Used</p><p className="font-semibold">{data.usedQty}</p></div>
              <div><p className="text-xs text-slate-500">Available</p><p className="font-semibold">{data.availableQty}</p></div>
            </div>
          </Card>

          <Card>
            <h3 className="section-title">Voucher QR</h3>
            {qrPreview ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-slate-800">{qrPreview.serialNo}</p>
                <Image
                  src={qrPreview.dataUrl}
                  alt="Voucher QR"
                  width={460}
                  height={460}
                  unoptimized
                  className="h-auto w-full max-w-sm rounded-2xl ring-1 ring-slate-200"
                />
                <p className="text-xs text-slate-500">Scan this QR at voucher redemption.</p>
              </div>
            ) : (
              <p className="muted mt-3">Select a voucher and click View QR.</p>
            )}
          </Card>

          <Card>
            <h3 className="section-title mb-3">Voucher Issued Detail</h3>
            {error ? <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-auto"
              >
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="LOCKED">Locked</option>
                <option value="REDEEMED">Redeemed</option>
                <option value="EXPIRED">Expired</option>
              </Select>
              <Input
                placeholder="Search serial no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {filteredVouchers.length} of {data.vouchers.length} vouchers
                </span>
                <Button variant="ghost" onClick={exportExcel} disabled={exporting}>
                  {exporting ? "Exporting..." : "Export To Excel"}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Serial No</th>
                    <th className="px-3 py-2">Effective</th>
                    <th className="px-3 py-2">Expiry</th>
                    <th className="px-3 py-2">Last Redeem</th>
                    <th className="px-3 py-2">Gate</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                        No vouchers match the filter.
                      </td>
                    </tr>
                  ) : null}
                  {filteredVouchers.map((v) => (
                    <tr key={v.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{v.serialNo}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(v.effectiveDate)}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(v.expiryDate)}</td>
                      <td className="px-3 py-2 text-slate-600">{v.redeemedAt ? formatDate(v.redeemedAt) : "-"}</td>
                      <td className="px-3 py-2 text-slate-600">{v.entranceGate || "-"}</td>
                      <td className="px-3 py-2">
                        <Badge tone={tone(v.redeemStatus)}>{v.redeemStatus}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" onClick={() => openQr(v)}>
                          View QR
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </ProtectedShell>
  );
}

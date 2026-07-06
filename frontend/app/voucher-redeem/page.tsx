"use client";

import { FormEvent, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/fetcher";
import { formatDateTime } from "@/lib/utils";

interface RedeemResult {
  serialNo: string;
  productName: string;
  companyName: string;
  accountCode: string | null;
  redeemedAt: string | null;
  entranceGate: string | null;
}

export default function VoucherRedeemPage() {
  const [code, setCode] = useState("");
  const [gate, setGate] = useState("");
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const data = await apiFetch<RedeemResult>("/api/vouchers/redeem", {
        method: "POST",
        body: JSON.stringify({ code, entranceGate: gate || undefined })
      });
      setResult(data);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedShell roles={["STAFF", "ADMIN"]} title="Voucher Redemption" subtitle="Redeem agent/partner vouchers at the gate">
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Voucher Serial No or QR Code *
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. APM-V-26-123456_001 (or scan QR)"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Entrance Gate</label>
              <Input value={gate} onChange={(e) => setGate(e.target.value)} placeholder="e.g. Gate 1 (optional)" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Redeeming..." : "Redeem Voucher"}
            </Button>
          </form>
        </Card>

        {error ? (
          <Card className="border border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-700">✕ {error}</p>
          </Card>
        ) : null}

        {result ? (
          <Card className="border border-emerald-200 bg-emerald-50">
            <p className="text-sm font-semibold text-emerald-700">✓ Voucher redeemed successfully</p>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p>Serial: {result.serialNo}</p>
              <p>Product: {result.productName}</p>
              <p>
                Company: {result.companyName} ({result.accountCode})
              </p>
              <p>Redeemed: {result.redeemedAt ? formatDateTime(result.redeemedAt) : "-"}</p>
              {result.entranceGate ? <p>Gate: {result.entranceGate}</p> : null}
            </div>
          </Card>
        ) : null}
      </div>
    </ProtectedShell>
  );
}

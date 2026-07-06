"use client";

import { useCallback, useRef, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QrScanner } from "@/components/scanner/qr-scanner";
import { apiFetch } from "@/lib/fetcher";
import { formatDateTime } from "@/lib/utils";

interface ScanResult {
  result: "VALID" | "ALREADY_USED" | "EXPIRED" | "INVALID";
  message: string;
  checkedInAt?: string;
  ticket?: {
    ticketCode: string;
    visitDate: string;
    ticketType?: {
      name: string;
    } | null;
    booking?: {
      customerName: string;
    } | null;
  } | null;
}

interface TicketPayload {
  ticketId: string;
  qrToken: string;
  signature: string;
  ts: number;
}

export default function ScannerPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const recentScanRef = useRef<{ value: string; atMs: number } | null>(null);

  const onScan = useCallback(async (decodedText: string) => {
    const normalizedPayload = decodedText.trim();
    const now = Date.now();

    if (processingRef.current) return;

    if (
      recentScanRef.current &&
      recentScanRef.current.value === normalizedPayload &&
      now - recentScanRef.current.atMs < 2_000
    ) {
      return;
    }

    processingRef.current = true;
    setProcessing(true);
    setError(null);

    try {
      const payload = JSON.parse(normalizedPayload) as TicketPayload;
      if (!payload.ticketId || !payload.qrToken || !payload.signature || !payload.ts) {
        throw new Error("QR payload is incomplete");
      }

      const response = await apiFetch<ScanResult>("/api/tickets/validate", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setResult(response);
      recentScanRef.current = { value: normalizedPayload, atMs: Date.now() };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid QR payload");
      recentScanRef.current = { value: normalizedPayload, atMs: Date.now() };
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, []);

  const toneByResult: Record<NonNullable<ScanResult["result"]>, "default" | "success" | "warning" | "danger"> = {
    VALID: "success",
    ALREADY_USED: "warning",
    EXPIRED: "danger",
    INVALID: "danger"
  };

  return (
    <ProtectedShell
      roles={["ADMIN", "STAFF"]}
      title="Gate Scanner"
      subtitle="Scan ticket QR and validate entry instantly"
    >
      <section className="bento-grid lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h3 className="section-title">Camera Scanner</h3>
          <p className="muted mt-1">Point camera at QR code. Validation runs automatically.</p>
          <div className="mt-4">
            <QrScanner onScan={onScan} />
          </div>
          {processing ? (
            <div className="mt-3 space-y-2" role="status" aria-live="polite" aria-label="Validating ticket">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : null}
          {error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </Card>

        <Card>
          <h3 className="section-title">Scan Result</h3>
          {result ? (
            <div className="mt-3 space-y-3">
              <Badge tone={toneByResult[result.result]}>{result.result}</Badge>
              <p className="text-sm font-semibold text-slate-800">{result.message}</p>

              {result.ticket ? (
                <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-800">{result.ticket.ticketCode}</p>
                  <p className="text-xs text-slate-500">Holder: {result.ticket.booking?.customerName ?? "-"}</p>
                  <p className="text-xs text-slate-500">Type: {result.ticket.ticketType?.name ?? "-"}</p>
                  <p className="text-xs text-slate-500">Visit: {result.ticket.visitDate.slice(0, 10)}</p>
                  {result.checkedInAt ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Checked in: {formatDateTime(result.checkedInAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="muted mt-3">Waiting for first scan...</p>
          )}

          <Button className="mt-4 w-full" variant="ghost" onClick={() => setResult(null)}>
            Clear Result
          </Button>
        </Card>
      </section>
    </ProtectedShell>
  );
}

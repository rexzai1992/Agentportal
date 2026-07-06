"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
}

export const QrScanner = ({ onScan }: QrScannerProps) => {
  const scannerRef = useRef<unknown>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let active = true;

    const mountScanner = async () => {
      try {
        const mod = await import("html5-qrcode");
        if (!active) return;

        const scanner = new mod.Html5Qrcode("travel-agent-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1
          },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {
            // Ignore scan failures to keep scanner responsive.
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to start scanner");
      }
    };

    mountScanner();

    return () => {
      active = false;
      const scanner = scannerRef.current as
        | {
            stop: () => Promise<void>;
            clear: () => Promise<void>;
          }
        | undefined;

      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // noop
          });
        }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div id="travel-agent-qr-reader" className="overflow-hidden rounded-2xl border border-slate-200 bg-black" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

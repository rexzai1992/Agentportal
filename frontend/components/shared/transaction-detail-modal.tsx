"use client";

import { MouseEvent, useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatStatusLabel, statusTone } from "@/lib/status";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface OrderDetail {
  orderReference: string;
  status: string;
  companyName: string;
  transactionDate: string;
  subtotal: number;
  discountTotal: number;
  totalPayable: number;
  items: Array<{
    id: string;
    productName: string;
    productType: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

/** Modal that fetches and shows the full details for a transaction reference. */
export const TransactionDetailModal = ({
  reference,
  open,
  onClose
}: {
  reference: string;
  open: boolean;
  onClose: () => void;
}) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await apiFetch<OrderDetail>(`/api/purchases/${encodeURIComponent(reference)}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transaction");
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <Modal open={open} onClose={onClose} title="Transaction Details" className="max-w-2xl">
      {loading || (!order && !error) ? (
        <LoadingState label="Loading transaction..." />
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      ) : order ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Reference No</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xl font-black tracking-widest text-emerald-700">
                {order.orderReference}
              </span>
              <Badge tone={statusTone(order.status)}>{formatStatusLabel(order.status)}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Info label="Company" value={order.companyName} />
              <Info label="Transaction Date" value={formatDateTime(order.transactionDate)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Price</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-t border-slate-100">
                    <td className="px-2 py-2">{i.productName}</td>
                    <td className="px-2 py-2 text-slate-600">{i.productType}</td>
                    <td className="px-2 py-2">{formatCurrency(i.unitPrice)}</td>
                    <td className="px-2 py-2">{i.quantity}</td>
                    <td className="px-2 py-2">{formatCurrency(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1 text-right text-sm">
            <p>Sub Total: {formatCurrency(order.subtotal)}</p>
            <p>Discount: -{formatCurrency(order.discountTotal)}</p>
            <p className="text-base font-bold">Total: {formatCurrency(order.totalPayable)}</p>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

/**
 * A transaction reference rendered as a clickable green link that opens the
 * full transaction details in a modal. Self-contained — drop it anywhere a
 * reference number is shown.
 */
export const ReferenceLink = ({
  reference,
  className
}: {
  reference: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        title="View full transaction details"
        className={
          className ??
          "font-semibold text-emerald-700 underline decoration-emerald-300 decoration-dotted underline-offset-2 hover:text-emerald-800 hover:decoration-solid"
        }
      >
        {reference}
      </button>
      <TransactionDetailModal reference={reference} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);

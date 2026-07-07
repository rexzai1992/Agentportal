"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/utils";

interface CatalogItem {
  schemeProductId: string;
  ticketTypeId: string;
  name: string;
  category: string;
  outletName: string;
  price: number;
  minQty: number;
  maxQty: number | null;
  incentiveRate: number | null;
}

export default function TicketPurchasePage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [outlet, setOutlet] = useState("ALL");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCatalog(await apiFetch<CatalogItem[]>("/api/purchases/catalog"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const outlets = useMemo(
    () => ["ALL", ...Array.from(new Set(catalog.map((c) => c.outletName)))],
    [catalog]
  );
  const visible = catalog.filter((c) => outlet === "ALL" || c.outletName === outlet);

  const addToCart = (item: CatalogItem, qty: number) => {
    let q = qty;
    if (q < item.minQty) q = item.minQty;
    if (item.maxQty && q > item.maxQty) q = item.maxQty;
    setCart((prev) => ({ ...prev, [item.schemeProductId]: q }));
  };

  const cartLines = catalog
    .filter((c) => cart[c.schemeProductId])
    .map((c) => ({ ...c, qty: cart[c.schemeProductId], lineTotal: c.price * cart[c.schemeProductId] }));
  const total = cartLines.reduce((sum, l) => sum + l.lineTotal, 0);

  const submit = async () => {
    if (cartLines.length === 0) {
      setError("Cart is empty");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ orderReference: string }>("/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          items: cartLines.map((l) => ({ schemeProductId: l.schemeProductId, quantity: l.qty }))
        })
      });
      router.push(`/transaction-review/${result.orderReference}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedShell roles={["AGENT"]} title="Ticket Purchase" subtitle="Buy tickets under your scheme">
      {loading ? (
        <LoadingState label="Loading products..." />
      ) : catalog.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            No products are available. An admin must bind a purchase scheme to your account.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Outlet</label>
              <Select value={outlet} onChange={(e) => setOutlet(e.target.value)} className="max-w-[220px]">
                {outlets.map((o) => (
                  <option key={o} value={o}>
                    {o === "ALL" ? "All Outlets" : o}
                  </option>
                ))}
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Item</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Qty (min/max)</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <PurchaseRow key={item.schemeProductId} item={item} onAdd={addToCart} current={cart[item.schemeProductId]} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="section-title mb-3">Order Summary</h3>
            {cartLines.length === 0 ? (
              <p className="text-sm text-slate-400">No items in cart.</p>
            ) : (
              <div className="space-y-2">
                {cartLines.map((l) => (
                  <div key={l.schemeProductId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{l.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(l.price)} × {l.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(l.lineTotal)}</span>
                      <button
                        className="text-red-500"
                        onClick={() =>
                          setCart((prev) => {
                            const next = { ...prev };
                            delete next[l.schemeProductId];
                            return next;
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            )}
            {error ? <p className="mt-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
            <Button className="mt-4 w-full" onClick={submit} disabled={submitting || cartLines.length === 0}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </Card>
        </div>
      )}
    </ProtectedShell>
  );
}

const PurchaseRow = ({
  item,
  current,
  onAdd
}: {
  item: CatalogItem;
  current?: number;
  onAdd: (item: CatalogItem, qty: number) => void;
}) => {
  const [qty, setQty] = useState(current ?? item.minQty);
  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-2">
        <p className="font-medium text-slate-800">{item.name}</p>
        <p className="text-xs text-slate-500">{item.outletName} · {item.category}</p>
      </td>
      <td className="px-2 py-2">{formatCurrency(item.price)}</td>
      <td className="px-2 py-2">
        <Input
          type="number"
          className="w-24"
          value={qty}
          min={item.minQty}
          max={item.maxQty ?? undefined}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <span className="ml-1 text-xs text-slate-400">
          {item.minQty}-{item.maxQty ?? "∞"}
        </span>
      </td>
      <td className="px-2 py-2">
        <Button variant="ghost" className="h-9 px-3" onClick={() => onAdd(item, qty)}>
          {current ? "Update" : "Add"}
        </Button>
      </td>
    </tr>
  );
};

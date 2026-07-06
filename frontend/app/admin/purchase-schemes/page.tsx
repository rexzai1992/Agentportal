"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading";
import { ProductPicker, type ProductOption } from "@/components/shared/product-picker";
import { apiFetch } from "@/lib/fetcher";

interface SchemeRow {
  id: string;
  code: string;
  name: string;
  organisation: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface DraftProduct {
  ticketTypeId: string;
  name: string;
  price: number;
  minQty: number;
  maxQty: number | null;
  incentiveRate: number | null;
}

export default function PurchaseSchemesPage() {
  const [rows, setRows] = useState<SchemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ code: "", name: "", organisation: "Agent Portal", effectiveDate: "" });
  const [products, setProducts] = useState<DraftProduct[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<SchemeRow[]>("/api/purchase-schemes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addProducts = (selected: ProductOption[]) => {
    setProducts((prev) => {
      const existing = new Set(prev.map((p) => p.ticketTypeId));
      const additions = selected
        .filter((s) => !existing.has(s.id))
        .map((s) => ({
          ticketTypeId: s.id,
          name: s.name,
          price: s.sellingPrice,
          minQty: 1,
          maxQty: null,
          incentiveRate: null
        }));
      return [...prev, ...additions];
    });
  };

  const updateProduct = (id: string, patch: Partial<DraftProduct>) =>
    setProducts((prev) => prev.map((p) => (p.ticketTypeId === id ? { ...p, ...patch } : p)));

  const submit = async () => {
    setError(null);
    if (!form.code || !form.name || !form.effectiveDate) {
      setError("Code, name and effective date are required");
      return;
    }
    if (products.length === 0) {
      setError("Add at least one product");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/purchase-schemes", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          products: products.map((p) => ({
            ticketTypeId: p.ticketTypeId,
            price: p.price,
            minQty: p.minQty,
            maxQty: p.maxQty,
            incentiveRate: p.incentiveRate
          }))
        })
      });
      setShowForm(false);
      setForm({ code: "", name: "", organisation: "Agent Portal", effectiveDate: "" });
      setProducts([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Purchase Scheme" subtitle="Group products for agents & partners">
      <div className="mb-4">
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Close" : "New Purchase Scheme"}</Button>
      </div>

      {showForm ? (
        <Card className="mb-4">
          <h3 className="section-title mb-3">New Purchase Scheme</h3>
          {error ? <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Code</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Organisation</label>
              <Input value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Effective Date</label>
              <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
            </div>
          </div>

          <div className="mt-4">
            <Button variant="ghost" onClick={() => setPickerOpen(true)}>
              Add Product
            </Button>
          </div>

          {products.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Min Qty</th>
                    <th className="px-2 py-2">Max Qty</th>
                    <th className="px-2 py-2">Incentive %</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.ticketTypeId} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium text-slate-800">{p.name}</td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          className="w-24"
                          value={p.price}
                          onChange={(e) => updateProduct(p.ticketTypeId, { price: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={p.minQty}
                          onChange={(e) => updateProduct(p.ticketTypeId, { minQty: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={p.maxQty ?? ""}
                          onChange={(e) =>
                            updateProduct(p.ticketTypeId, {
                              maxQty: e.target.value ? Number(e.target.value) : null
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={p.incentiveRate ?? ""}
                          onChange={(e) =>
                            updateProduct(p.ticketTypeId, {
                              incentiveRate: e.target.value ? Number(e.target.value) : null
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          className="text-red-500"
                          onClick={() =>
                            setProducts((prev) => prev.filter((x) => x.ticketTypeId !== p.ticketTypeId))
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-4">
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        {loading ? (
          <LoadingState label="Loading schemes..." />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No schemes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Purchase Code</th>
                  <th className="px-3 py-2">Purchase Name</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{row.code}</td>
                    <td className="px-3 py-2 text-slate-700">{row.name}</td>
                    <td className="px-3 py-2">
                      <Badge tone={row.status === "ACTIVE" ? "success" : "default"}>{row.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/purchase-schemes/${row.id}`} className="font-semibold text-emerald-700">
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

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={products.map((p) => p.ticketTypeId)}
        onConfirm={addProducts}
      />
    </ProtectedShell>
  );
}

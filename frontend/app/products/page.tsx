"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/utils";

interface ProductItem {
  id: string;
  outlet: {
    id: string;
    name: string;
    code: string;
  };
  name: string;
  sku: string;
  category: "ADULT" | "CHILD" | "BUNDLE";
  description?: string | null;
  imageUrl?: string | null;
  sellingPrice: number | string;
  active: boolean;
  createdAt: string;
}

interface OutletItem {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

interface ProductForm {
  outletId: string;
  name: string;
  sku: string;
  type: "ADULT" | "CHILD" | "BUNDLE";
  description: string;
  imageUrl: string;
  price: string;
}

const initialForm: ProductForm = {
  outletId: "",
  name: "",
  sku: "",
  type: "ADULT",
  description: "",
  imageUrl: "",
  price: "80"
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productData, outletData] = await Promise.all([
        apiFetch<ProductItem[]>("/api/ticket-types?activeOnly=false"),
        apiFetch<OutletItem[]>("/api/outlets")
      ]);
      setProducts(productData);
      setOutlets(outletData);
      setForm((prev) => (prev.outletId || !outletData[0] ? prev : { ...prev, outletId: outletData[0].id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiFetch<ProductItem>("/api/ticket-types", {
        method: "POST",
        body: JSON.stringify({
          outletId: form.outletId,
          name: form.name,
          sku: form.sku,
          type: form.type,
          description: form.description,
          imageUrl: form.imageUrl,
          price: Number(form.price)
        })
      });

      setForm({ ...initialForm, outletId: form.outletId });
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell
      roles={["ADMIN"]}
      title="Products"
      subtitle="Create products after assigning them to an outlet"
    >
      <section className="bento-grid lg:grid-cols-[1fr_1fr]">
        <Card>
          <h3 className="section-title">Create Product</h3>
          <p className="muted mt-1">Select outlet, then enter name, SKU, type, description, image and price.</p>
          {!outlets.length ? (
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
              Create an outlet before adding products.{" "}
              <Link href="/admin/outlets" className="font-semibold underline">
                Go to Outlets
              </Link>
            </div>
          ) : null}
          <form className="mt-3 grid gap-3" onSubmit={onCreate}>
            <Select
              value={form.outletId}
              onChange={(event) => setForm((prev) => ({ ...prev, outletId: event.target.value }))}
              required
              disabled={!outlets.length}
            >
              <option value="" disabled>
                Select Outlet
              </option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name} ({outlet.code})
                </option>
              ))}
            </Select>
            <Input
              placeholder="Product Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <Input
              placeholder="SKU (e.g. TA-ADULT-80)"
              value={form.sku}
              onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value.toUpperCase() }))}
              required
            />
            <Select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  type: event.target.value as ProductForm["type"]
                }))
              }
            >
              <option value="ADULT">ADULT</option>
              <option value="CHILD">CHILD</option>
              <option value="BUNDLE">BUNDLE</option>
            </Select>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              required
            />
            <Input
              placeholder="Image URL"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              required
            />
            <Input
              placeholder="Price"
              type="number"
              min={1}
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
            <Button type="submit" disabled={saving || !outlets.length}>
              {saving ? <Skeleton className="h-4 w-24 bg-white/70" /> : "Create Product"}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="section-title">Preview</h3>
          <div className="mt-3 space-y-3">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Product preview"
                className="h-48 w-full rounded-2xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500 ring-1 ring-slate-200">
                Image preview
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-emerald-700">
                {outlets.find((outlet) => outlet.id === form.outletId)?.name || "Select Outlet"}
              </p>
              <p className="text-sm font-semibold text-slate-800">{form.name || "Product Name"}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{form.sku || "SKU"}</p>
              <p className="mt-1 text-xs text-slate-600">{form.description || "Product description"}</p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {formatCurrency(Number(form.price || 0))}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h3 className="section-title">Product Catalog</h3>
          <Button variant="secondary" onClick={loadProducts}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="mt-3 space-y-2" role="status" aria-live="polite" aria-label="Loading products">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">Outlet</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Price</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <p className="font-semibold text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.description || "-"}</p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="font-semibold text-slate-700">{product.outlet.name}</p>
                      <p className="font-mono text-xs text-slate-500">{product.outlet.code}</p>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-slate-700">{product.sku || "-"}</td>
                    <td className="px-2 py-2">{product.category}</td>
                    <td className="px-2 py-2 font-semibold text-slate-800">
                      {formatCurrency(Number(product.sellingPrice))}
                    </td>
                    <td className="px-2 py-2">
                      <Badge tone={product.active ? "success" : "warning"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!products.length ? <p className="muted px-2 py-4">No products yet.</p> : null}
          </div>
        )}
      </Card>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </ProtectedShell>
  );
}

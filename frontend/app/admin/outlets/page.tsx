"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/fetcher";

interface OutletItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  address?: string | null;
  active: boolean;
  createdAt: string;
}

interface OutletForm {
  name: string;
  code: string;
  description: string;
  address: string;
}

const initialForm: OutletForm = {
  name: "",
  code: "",
  description: "",
  address: ""
};

const normalizeCodeInput = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [form, setForm] = useState<OutletForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadOutlets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OutletItem[]>("/api/outlets?activeOnly=false");
      setOutlets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load outlets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiFetch<OutletItem>("/api/outlets", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm(initialForm);
      await loadOutlets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create outlet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell
      roles={["ADMIN"]}
      title="Outlets"
      subtitle="Create outlets before assigning products to them"
    >
      <section className="bento-grid lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="section-title">Create Outlet</h3>
          <p className="muted mt-1">Products must be assigned to an outlet.</p>
          <form className="mt-3 grid gap-3" onSubmit={onCreate}>
            <Input
              placeholder="Outlet Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <Input
              placeholder="Code (e.g. MAIN)"
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: normalizeCodeInput(event.target.value) }))
              }
              required
            />
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
            />
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="Address"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              rows={3}
            />
            <Button type="submit" disabled={saving}>
              {saving ? <Skeleton className="h-4 w-24 bg-white/70" /> : "Create Outlet"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="section-title">Outlet List</h3>
            <Button variant="secondary" onClick={loadOutlets}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="mt-3 space-y-2" role="status" aria-live="polite" aria-label="Loading outlets">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-2 py-2">Outlet</th>
                    <th className="px-2 py-2">Code</th>
                    <th className="px-2 py-2">Address</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outlets.map((outlet) => (
                    <tr key={outlet.id} className="border-b border-slate-100">
                      <td className="px-2 py-2">
                        <p className="font-semibold text-slate-800">{outlet.name}</p>
                        <p className="text-xs text-slate-500">{outlet.description || "-"}</p>
                      </td>
                      <td className="px-2 py-2 font-mono text-xs text-slate-700">{outlet.code}</td>
                      <td className="px-2 py-2 text-slate-600">{outlet.address || "-"}</td>
                      <td className="px-2 py-2">
                        <Badge tone={outlet.active ? "success" : "warning"}>
                          {outlet.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!outlets.length ? <p className="muted px-2 py-4">No outlets yet.</p> : null}
            </div>
          )}
        </Card>
      </section>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="section-title">Next Step</h3>
          <p className="muted mt-1">After creating an outlet, create products and select that outlet.</p>
        </div>
        <Link
          href="/products"
          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go to Products
        </Link>
      </Card>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </ProtectedShell>
  );
}

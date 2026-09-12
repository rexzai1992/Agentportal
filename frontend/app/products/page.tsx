"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { parseProductBatch } from "@shared/types/product-batch";

type Row = { name: string; sku: string; type: "ADULT" | "CHILD" | "BUNDLE"; price: string; schemePrice: string };
type Settings = { outletId: string; schemeId: string; description: string; imageUrl: string };
type Product = { id: string; name: string; sku: string; category: string; sellingPrice: number; active: boolean; outlet: { name: string } };
type Option = { id: string; name: string; status?: string };
const blank = (): Row => ({ name: "", sku: "", type: "ADULT", price: "", schemePrice: "" });
const initial: Settings = { outletId: "", schemeId: "", description: "", imageUrl: "" };

export default function ProductsPage() {
  const { user } = useSession(["ADMIN"]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Option[]>([]);
  const [schemes, setSchemes] = useState<Option[]>([]);
  const [settings, setSettings] = useState<Settings>(initial);
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<string | null>(null);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const submitting = useRef(false);
  const draftKey = user ? `product-batch-draft:${user.id}` : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, s] = await Promise.all([
        apiFetch<Product[]>("/api/ticket-types?activeOnly=false"),
        apiFetch<Option[]>("/api/outlets"), apiFetch<Option[]>("/api/purchase-schemes")
      ]);
      setProducts(p); setOutlets(o); setSchemes(s.filter((item) => item.status === "ACTIVE"));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load products"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (user) void load(); }, [load, user]);
  useEffect(() => {
    if (!draftKey) return;
    try { setDraftAvailable(Boolean(localStorage.getItem(draftKey))); } catch { /* Storage may be disabled. */ }
  }, [draftKey]);
  useEffect(() => {
    let cancelled = false;
    setSchedule(null);
    if (settings.schemeId) apiFetch<{ revisions: { effectiveDate: string }[] }>(`/api/purchase-schemes/${settings.schemeId}`)
      .then((scheme) => { if (!cancelled) setSchedule(scheme.revisions[0]?.effectiveDate ?? null); })
      .catch(() => { if (!cancelled) setError("Unable to check the scheme schedule. Try selecting the scheme again."); });
    return () => { cancelled = true; };
  }, [settings.schemeId]);

  const update = (index: number, field: keyof Row, value: string) => setRows((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  const saveDraft = () => {
    try {
      if (!draftKey) return;
      localStorage.setItem(draftKey, JSON.stringify({ settings, rows }));
      setDraftAvailable(true); setMessage("Draft saved in this browser. Products have not been created."); setError(null);
    } catch { setError("This browser could not save the draft. Keep this page open."); }
  };
  const restoreDraft = () => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey!) ?? "null");
      if (!draft || !Array.isArray(draft.rows) || draft.rows.length < 1 || draft.rows.length > 200 ||
        !draft.settings || !Object.keys(initial).every((key) => typeof draft.settings[key] === "string") ||
        !draft.rows.every((row: Record<string, unknown>) => Object.keys(blank()).every((key) => typeof row[key] === "string"))) throw new Error();
      setSettings(draft.settings); setRows(draft.rows); setMessage("Draft restored."); setError(null);
    } catch { setError("The saved draft could not be restored."); }
  };
  const importFile = async (file: File) => {
    setError(null); setMessage(null); setBusy(true);
    try {
      const data = new FormData(); data.append("file", file);
      const response = await fetch("/api/ticket-types/import", { method: "POST", body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Import failed");
      const imported: Row[] = body.data.products.map((p: { name: string; sku: string; type: Row["type"]; price: number; schemePrice?: number }) => ({ ...p, price: String(p.price), schemePrice: p.schemePrice === undefined ? "" : String(p.schemePrice) }));
      const existing = rows.filter((row) => Object.values(row).some((value, i) => i !== 2 && value !== ""));
      if (existing.length + imported.length > 200) throw new Error("Maximum 200 rows. Import a smaller file.");
      setRows([...existing, ...imported]); setMessage(`Imported ${imported.length} rows. Check them, then create the products.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Import failed"); }
    finally { setBusy(false); }
  };
  const create = async () => {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(null); setMessage(null);
    try {
      const payload = parseProductBatch({ ...settings, products: rows.map((row) => ({ ...row, price: Number(row.price), schemePrice: settings.schemeId && row.schemePrice !== "" ? Number(row.schemePrice) : undefined })) });
      const result = await apiFetch<{ count: number; schemeName: string | null; schemeEffectiveDate: string | null }>("/api/ticket-types/batch", { method: "POST", body: JSON.stringify(payload) });
      setRows([blank()]);
      try { if (draftKey) localStorage.removeItem(draftKey); } catch { /* Creation already succeeded. */ }
      setDraftAvailable(false);
      setMessage(`Created ${result.count} products.${result.schemeName ? ` Added to ${result.schemeName}, effective ${new Date(result.schemeEffectiveDate!).toLocaleString()}.` : " You can add these products to a scheme later."}`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create products. Check the catalog before retrying."); }
    finally { submitting.current = false; setBusy(false); }
  };

  return <ProtectedShell roles={["ADMIN"]} title="Products" subtitle="Create multiple products together — no review required">
    <Card>
      <h3 className="section-title">Shared settings</h3>
      <p className="muted mt-1">Choose the outlet once. Optionally add every product to a scheme using its base price or a row-specific price.</p>
      {!loading && !outlets.length && <p className="mt-3 text-amber-800">An active outlet is required. <Link className="underline" href="/admin/outlets">Create an outlet</Link></p>}
      <fieldset disabled={busy} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Outlet<Select aria-label="Outlet" value={settings.outletId} onChange={(e) => setSettings({ ...settings, outletId: e.target.value })}><option value="">Select outlet</option>{outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></label>
        <label className="text-sm">Add to scheme<Select aria-label="Add to scheme" value={settings.schemeId} onChange={(e) => setSettings({ ...settings, schemeId: e.target.value })}><option value="">Create products only</option>{schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
        <label className="text-sm">Shared description (optional)<Input value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></label>
        <label className="text-sm">Shared image URL (optional)<Input type="url" value={settings.imageUrl} onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })} /></label>
      </fieldset>
      {settings.schemeId && <p className="mt-3 text-sm text-slate-600">Existing scheme products and pricing are preserved. New products use minimum quantity 1 and no discount or incentive.{schedule && new Date(schedule).getTime() > Date.now() ? ` This scheme is scheduled: these products join it on ${new Date(schedule).toLocaleDateString()}.` : " The new prices take effect immediately."}</p>}
      <p className="muted mt-2">Vouchers currently expire one year after issuance.</p>
    </Card>
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="section-title">Products · {rows.length} / 200</h3><label className="text-sm">Import Excel (.xlsx)<input aria-label="Import Excel" className="ml-2 max-w-64 text-sm" type="file" accept=".xlsx" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void importFile(file); e.target.value = ""; }} /></label></div>
      <p className="muted mt-2">Excel headers: Name, SKU, Type, Price, Scheme Price (optional). Type: ADULT, CHILD or BUNDLE. Import adds rows without creating products.</p>
      <fieldset disabled={busy}>
      <div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-slate-500">{["#", "Name", "SKU", "Type", "Base price", ...(settings.schemeId ? ["Scheme price"] : []), "Actions"].map((h) => <th className="px-2 py-2" key={h}>{h}</th>)}</tr></thead><tbody>
        {rows.map((row, i) => <tr key={i} className="border-t border-slate-100"><td className="px-2">{i + 1}</td>
          <td className="p-2"><Input aria-label={`Row ${i + 1} name`} className="min-w-44" value={row.name} onChange={(e) => update(i, "name", e.target.value)} /></td>
          <td className="p-2"><Input aria-label={`Row ${i + 1} SKU`} className="min-w-36" value={row.sku} onChange={(e) => update(i, "sku", e.target.value.toUpperCase())} /></td>
          <td className="p-2"><Select aria-label={`Row ${i + 1} type`} value={row.type} onChange={(e) => update(i, "type", e.target.value)}>{["ADULT", "CHILD", "BUNDLE"].map((t) => <option key={t}>{t}</option>)}</Select></td>
          <td className="p-2"><Input aria-label={`Row ${i + 1} price`} className="w-28" type="number" min="0.01" step="0.01" value={row.price} onChange={(e) => update(i, "price", e.target.value)} /></td>
          {settings.schemeId && <td className="p-2"><Input aria-label={`Row ${i + 1} scheme price`} className="w-28" type="number" min="0.01" step="0.01" placeholder="Base price" value={row.schemePrice} onChange={(e) => update(i, "schemePrice", e.target.value)} /></td>}
          <td className="p-2"><div className="flex gap-2"><Button variant="ghost" aria-label={`Copy row ${i + 1}`} disabled={rows.length >= 200} onClick={() => setRows((prev) => [...prev, { ...row, sku: "" }])}>Copy</Button><Button variant="ghost" aria-label={`Remove row ${i + 1}`} onClick={() => setRows((prev) => prev.length === 1 ? [blank()] : prev.filter((_, index) => index !== i))}>Remove</Button></div></td>
        </tr>)}
      </tbody></table></div>
      <div className="mt-4 flex flex-wrap gap-2"><Button variant="ghost" disabled={rows.length >= 200} onClick={() => setRows((prev) => [...prev, blank()])}>Add row</Button><Button variant="ghost" onClick={saveDraft}>Save draft</Button>{draftAvailable && <Button variant="ghost" onClick={restoreDraft}>Restore saved draft</Button>}<Button disabled={loading || !settings.outletId} onClick={create}>{busy ? "Working…" : `Create ${rows.length} product${rows.length === 1 ? "" : "s"}`}</Button></div>
      </fieldset>
      <p className="muted mt-2">Copy keeps the row details and clears the SKU. Drafts stay in this browser. If any row is invalid, the whole batch stays uncreated for correction.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    </Card>
    <Card><div className="flex items-center justify-between"><h3 className="section-title">Product catalog</h3><Button variant="ghost" disabled={busy || loading} onClick={load}>Refresh</Button></div>
      {loading ? <p className="py-4">Loading products…</p> : <div className="mt-3 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-slate-500">{["Product", "Outlet", "SKU", "Type", "Base price", "Status"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{products.map((p) => <tr key={p.id} className="border-t border-slate-100"><td className="p-2">{p.name}</td><td className="p-2">{p.outlet.name}</td><td className="p-2">{p.sku}</td><td className="p-2">{p.category}</td><td className="p-2">{formatCurrency(Number(p.sellingPrice))}</td><td className="p-2">{p.active ? "Active" : "Inactive"}</td></tr>)}</tbody></table>{!products.length && <p className="py-4">No products yet.</p>}</div>}
    </Card>
  </ProtectedShell>;
}

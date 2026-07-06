"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface Binding {
  id: string;
  bindingType: string;
  incentive: string | null;
  effectiveDate: string;
  schemeCode: string;
  schemeName: string;
}
interface SchemeOption {
  id: string;
  code: string;
  name: string;
}

export default function BindSchemePage() {
  const params = useParams<{ id: string }>();
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [schemes, setSchemes] = useState<SchemeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("STANDARD");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ schemeId: "", incentive: "", effectiveDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        apiFetch<Binding[]>(`/api/accounts/${params.id}/scheme-bindings`),
        apiFetch<SchemeOption[]>("/api/purchase-schemes")
      ]);
      setBindings(b);
      setSchemes(s);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError(null);
    if (!form.schemeId || !form.effectiveDate) {
      setError("Scheme and effective date are required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/accounts/${params.id}/scheme-bindings`, {
        method: "POST",
        body: JSON.stringify({
          schemeId: form.schemeId,
          bindingType: tab,
          incentive: form.incentive || null,
          effectiveDate: form.effectiveDate
        })
      });
      setModalOpen(false);
      setForm({ schemeId: "", incentive: "", effectiveDate: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const visible = bindings.filter((b) => b.bindingType === tab);

  return (
    <ProtectedShell roles={["ADMIN"]} title="Scheme Binding" subtitle="Bind purchase schemes to this account">
      <div className="mb-4 flex items-center justify-between">
        <Tabs
          tabs={[
            { key: "STANDARD", label: "Standard" },
            { key: "SPECIAL", label: "Special" }
          ]}
          active={tab}
          onChange={setTab}
        />
        <Button onClick={() => setModalOpen(true)}>Add New Revision</Button>
      </div>

      <Card>
        {loading ? (
          <LoadingState label="Loading bindings..." />
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No {tab.toLowerCase()} bindings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Effective Date</th>
                  <th className="px-3 py-2">Purchase Scheme</th>
                  <th className="px-3 py-2">Incentive</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-600">{formatDate(b.effectiveDate)}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {b.schemeCode} · {b.schemeName}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{b.incentive || "Not Applicable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Revision">
        {error ? <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Effective Date</label>
            <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Purchase</label>
            <Select value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })}>
              <option value="">Please Select...</option>
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Incentive</label>
            <Input value={form.incentive} onChange={(e) => setForm({ ...form, incentive: e.target.value })} placeholder="Optional" />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Submit"}
          </Button>
        </div>
      </Modal>
    </ProtectedShell>
  );
}

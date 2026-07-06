"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingState } from "@/components/ui/loading";
import { FileUpload } from "@/components/forms/FileUpload";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  displayType: "HOME" | "LOGIN";
  audience: "AGENT" | "PARTNER" | "BOTH";
  effectiveDate: string;
  expiryDate: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
}

const tone = (s: string) => (s === "ACTIVE" ? "success" : s === "EXPIRED" ? "danger" : "default");

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    displayType: "HOME" as "HOME" | "LOGIN",
    audienceAgent: true,
    audiencePartner: false,
    effectiveDate: "",
    expiryDate: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE"
  });
  const [mediaDocId, setMediaDocId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiFetch<Announcement[]>("/api/announcements"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError(null);
    if (!form.title || !form.effectiveDate || !form.expiryDate) {
      setError("Title, effective and expiry dates are required");
      return;
    }
    const audience =
      form.displayType === "LOGIN"
        ? "BOTH"
        : form.audienceAgent && form.audiencePartner
          ? "BOTH"
          : form.audiencePartner
            ? "PARTNER"
            : "AGENT";
    setSaving(true);
    try {
      await apiFetch("/api/announcements", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          displayType: form.displayType,
          audience,
          effectiveDate: form.effectiveDate,
          expiryDate: form.expiryDate,
          status: form.status,
          mediaDocumentId: mediaDocId
        })
      });
      setShowForm(false);
      setForm({ ...form, title: "", effectiveDate: "", expiryDate: "" });
      setMediaDocId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Announcement" subtitle="Share notices with agents & partners">
      <div className="mb-4">
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "Add New Announcement"}
        </Button>
      </div>

      {showForm ? (
        <Card className="mb-4">
          <h3 className="section-title mb-3">Add New Announcement</h3>
          {error ? <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Display Type</label>
              <Select
                value={form.displayType}
                onChange={(e) => setForm({ ...form, displayType: e.target.value as "HOME" | "LOGIN" })}
              >
                <option value="HOME">Home Page</option>
                <option value="LOGIN">Login Page</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title Name</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            {form.displayType === "HOME" ? (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">User Type</label>
                <div className="flex gap-4">
                  <Checkbox
                    label="Agent"
                    checked={form.audienceAgent}
                    onChange={(e) => setForm({ ...form, audienceAgent: e.target.checked })}
                  />
                  <Checkbox
                    label="Partner"
                    checked={form.audiencePartner}
                    onChange={(e) => setForm({ ...form, audiencePartner: e.target.checked })}
                  />
                </div>
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Effective Date</label>
              <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Expiry Date</label>
              <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <FileUpload
                label="File Name (JPG/PDF)"
                docType="ANNOUNCEMENT_MEDIA"
                ownerType="ANNOUNCEMENT"
                onUploaded={(r) => setMediaDocId(r?.documentId ?? null)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Submit"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        {loading ? (
          <LoadingState label="Loading announcements..." />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No announcements yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Display Type</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">User Type</th>
                  <th className="px-3 py-2">Effective</th>
                  <th className="px-3 py-2">Expiry</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{row.displayType === "HOME" ? "Home Page" : "Login Page"}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{row.title}</td>
                    <td className="px-3 py-2 text-slate-600">{row.audience}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(row.effectiveDate)}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(row.expiryDate)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={tone(row.status)}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ProtectedShell>
  );
}

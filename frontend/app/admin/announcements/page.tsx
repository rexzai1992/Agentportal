"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Power, PowerOff, X } from "lucide-react";
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
  mediaDocumentId?: string | null;
}

const tone = (s: string) => (s === "ACTIVE" ? "success" : s === "EXPIRED" ? "danger" : "default");

const emptyForm = {
  title: "",
  displayType: "HOME" as "HOME" | "LOGIN",
  audienceAgent: true,
  audiencePartner: false,
  effectiveDate: "",
  expiryDate: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE"
};

const toDateInput = (value: string) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
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

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
    setForm(emptyForm);
    setMediaDocId(null);
  };

  const startAdd = () => {
    if (showForm && !editingId) {
      resetForm();
      return;
    }
    setShowForm(true);
    setEditingId(null);
    setError(null);
    setForm(emptyForm);
    setMediaDocId(null);
  };

  const startEdit = (row: Announcement) => {
    setShowForm(true);
    setEditingId(row.id);
    setError(null);
    setForm({
      title: row.title,
      displayType: row.displayType,
      audienceAgent: row.audience === "AGENT" || row.audience === "BOTH",
      audiencePartner: row.audience === "PARTNER" || row.audience === "BOTH",
      effectiveDate: toDateInput(row.effectiveDate),
      expiryDate: toDateInput(row.expiryDate),
      status: row.status === "EXPIRED" ? "INACTIVE" : row.status
    });
    setMediaDocId(row.mediaDocumentId ?? null);
  };

  const resolveAudience = () =>
    form.displayType === "LOGIN"
      ? "BOTH"
      : form.audienceAgent && form.audiencePartner
        ? "BOTH"
        : form.audiencePartner
          ? "PARTNER"
          : "AGENT";

  const submit = async () => {
    setError(null);
    if (!form.title || !form.effectiveDate || !form.expiryDate) {
      setError("Title, effective and expiry dates are required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(editingId ? `/api/announcements/${editingId}` : "/api/announcements", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          title: form.title,
          displayType: form.displayType,
          audience: resolveAudience(),
          effectiveDate: form.effectiveDate,
          expiryDate: form.expiryDate,
          status: form.status,
          mediaDocumentId: mediaDocId
        })
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row: Announcement) => {
    setError(null);
    setActionId(row.id);
    try {
      await apiFetch(`/api/announcements/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        })
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update announcement");
    } finally {
      setActionId(null);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Announcement" subtitle="Share notices with agents & partners">
      <div className="mb-4">
        <Button onClick={startAdd}>
          {showForm && !editingId ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Close
            </>
          ) : (
            "Add New Announcement"
          )}
        </Button>
      </div>

      {showForm ? (
        <Card className="mb-4">
          <h3 className="section-title mb-3">
            {editingId ? "Edit Announcement" : "Add New Announcement"}
          </h3>
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Announcement" : "Submit"}
            </Button>
            {editingId ? (
              <Button variant="ghost" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {error && !showForm ? (
        <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p>
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
                  <th className="px-3 py-2 text-right">Actions</th>
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
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          className="min-h-9 px-3"
                          onClick={() => startEdit(row)}
                          disabled={actionId === row.id || saving}
                        >
                          <Pencil className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant={row.status === "ACTIVE" ? "danger" : "secondary"}
                          className="min-h-9 px-3"
                          onClick={() => toggleStatus(row)}
                          disabled={actionId === row.id || row.status === "EXPIRED"}
                          title={row.status === "EXPIRED" ? "Edit the expiry date before turning this on" : undefined}
                        >
                          {row.status === "ACTIVE" ? (
                            <PowerOff className="mr-1.5 h-4 w-4" />
                          ) : (
                            <Power className="mr-1.5 h-4 w-4" />
                          )}
                          {actionId === row.id ? "Saving..." : row.status === "ACTIVE" ? "Off" : "On"}
                        </Button>
                      </div>
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

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading";
import { apiFetch } from "@/lib/fetcher";

interface AccountDetail {
  id: string;
  accountCode: string | null;
  partyType: "AGENT" | "PARTNER";
  companyName: string;
  email: string;
  phone: string;
  registrationNo: string | null;
  kplLicenseNo: string | null;
  kplExpiryDate: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressLine3: string | null;
  postcode: string | null;
  country: string | null;
  state: string | null;
  targetMarket: string | null;
  salesChannel: string | null;
  accountStatus: "ACTIVE" | "INACTIVE" | "EXPIRED";
  accountExpiry: string | null;
  createdDate: string;
  contactPersons: Array<{ id: string; name: string; email: string | null; phone: string | null }>;
  documents: Array<{ id: string; docType: string; fileName: string }>;
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-800">{value || "-"}</p>
  </div>
);

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AccountDetail["accountStatus"]>("ACTIVE");
  const [expiry, setExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await apiFetch<AccountDetail>(`/api/accounts/${params.id}`);
      setData(detail);
      setStatus(detail.accountStatus);
      setExpiry(detail.accountExpiry ? detail.accountExpiry.slice(0, 10) : "");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/api/accounts/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ accountStatus: status, accountExpiry: expiry || null })
      });
      setMessage("Account updated successfully.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Account Detail" subtitle="View and update account">
      {loading || !data ? (
        <LoadingState label="Loading account..." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Card>
              <h3 className="section-title mb-3">
                {data.companyName} · {data.accountCode}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label="Party Type" value={data.partyType} />
                <Row label="Email" value={data.email} />
                <Row label="Phone" value={data.phone} />
                <Row label="Registration No" value={data.registrationNo} />
                <Row label="KPL License No" value={data.kplLicenseNo} />
                <Row label="Created" value={new Date(data.createdDate).toLocaleDateString()} />
                <Row
                  label="Address"
                  value={[data.addressLine1, data.addressLine2, data.addressLine3, data.postcode, data.state, data.country]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Row label="Target Market" value={data.targetMarket} />
                <Row label="Sales Channel" value={data.salesChannel} />
              </div>
            </Card>

            <Card>
              <h3 className="section-title mb-3">Documents</h3>
              {data.documents.length === 0 ? (
                <p className="text-sm text-slate-400">No documents.</p>
              ) : (
                <ul className="space-y-2">
                  {data.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2 text-sm">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {doc.docType}
                      </span>
                      <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                        {doc.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h3 className="section-title mb-3">Contact Persons</h3>
              <div className="space-y-2">
                {data.contactPersons.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                    <p className="font-medium text-slate-800">{c.name}</p>
                    <p className="text-slate-600">{c.email || "-"} · {c.phone || "-"}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="section-title mb-3">Account Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <Select value={status} onChange={(e) => setStatus(e.target.value as AccountDetail["accountStatus"])}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="EXPIRED">Expired</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Account Expiry</label>
                  <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                </div>
                <Button onClick={save} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Update"}
                </Button>
                {message ? <p className="text-sm text-slate-600">{message}</p> : null}
              </div>
            </Card>

            <Card>
              <h3 className="section-title mb-2">Scheme</h3>
              <Link
                href={`/admin/accounts/${data.id}/schemes`}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View / Bind Scheme →
              </Link>
            </Card>
          </div>
        </div>
      )}
    </ProtectedShell>
  );
}

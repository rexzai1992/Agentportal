"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading";
import { FileUpload } from "@/components/forms/FileUpload";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface Profile {
  companyName: string;
  accountCode: string | null;
  partyType: "AGENT" | "PARTNER";
  registrationNo: string | null;
  email: string;
  phone: string;
  kplLicenseNo: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postcode: string | null;
  state: string | null;
  country: string | null;
  createdDate: string;
  accountExpiry: string | null;
  accountStatus: "ACTIVE" | "INACTIVE" | "EXPIRED";
  canRenew: boolean;
  contactPersons: Array<{ id: string; name: string; email: string | null; phone: string | null }>;
  documents: Array<{ id: string; docType: string; fileName: string }>;
}
interface Renewal {
  status: string;
  remarks: string | null;
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-800">{value || "-"}</p>
  </div>
);

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [renewal, setRenewal] = useState<Renewal | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [kplDoc, setKplDoc] = useState<string | null>(null);
  const [ssmDoc, setSsmDoc] = useState<string | null>(null);
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        apiFetch<Profile>("/api/profile"),
        apiFetch<Renewal | null>("/api/renewals/latest")
      ]);
      setProfile(p);
      setRenewal(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAgent = profile?.partyType === "AGENT";

  const submitRenewal = async () => {
    setError(null);
    if (!ssmDoc) {
      setError("SSM Form is required");
      return;
    }
    if (isAgent) {
      if (!kplDoc) {
        setError("KPL Form is required");
        return;
      }
      if (!licenseNo.trim()) {
        setError("KPL License Number is required");
        return;
      }
      if (!licenseExpiry) {
        setError("KPL Expiry Date is required");
        return;
      }
      const minExpiry = new Date();
      minExpiry.setMonth(minExpiry.getMonth() + 2);
      if (new Date(licenseExpiry) < minExpiry) {
        setError("KPL Expiry Date must be at least 2 months from today");
        return;
      }
    }
    setBusy(true);
    try {
      await apiFetch("/api/renewals", {
        method: "POST",
        body: JSON.stringify({
          kplLicenseNo: isAgent ? licenseNo : undefined,
          kplExpiryDate: isAgent ? licenseExpiry : undefined,
          documentIds: isAgent ? [kplDoc, ssmDoc].filter(Boolean) : [ssmDoc].filter(Boolean)
        })
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedShell roles={["AGENT"]} title="Company Profile" subtitle="Your account details">
      {loading || !profile ? (
        <LoadingState label="Loading profile..." />
      ) : (
        <div className="space-y-4">
          <Card>
            <h3 className="section-title mb-3">Company Information</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Row label="Company Name" value={profile.companyName} />
              <Row label="Account Code" value={profile.accountCode} />
              <Row label="Registration No" value={profile.registrationNo} />
              <Row label="Email" value={profile.email} />
              <Row label="Phone" value={profile.phone} />
              <Row label="KPL License No" value={profile.kplLicenseNo} />
              <Row
                label="Address"
                value={[profile.addressLine1, profile.addressLine2, profile.postcode, profile.state, profile.country]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>
          </Card>

          <Card>
            <h3 className="section-title mb-3">Upload Documents</h3>
            {profile.documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents.</p>
            ) : (
              <ul className="space-y-2">
                {profile.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-sm">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{d.docType}</span>
                    <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                      {d.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 className="section-title mb-3">Account Status</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Row label="Created Date" value={formatDate(profile.createdDate)} />
              <Row label="Account Expiry" value={profile.accountExpiry ? formatDate(profile.accountExpiry) : "-"} />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <Badge tone={profile.accountStatus === "ACTIVE" ? "success" : "danger"}>{profile.accountStatus}</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="section-title mb-2">Account Renewal</h3>
            {renewal ? (
              <p className="mb-2 text-sm text-slate-600">
                Latest renewal status: <Badge tone={renewal.status === "APPROVED" ? "success" : "warning"}>{renewal.status}</Badge>
                {renewal.remarks ? ` — ${renewal.remarks}` : ""}
              </p>
            ) : null}
            {profile.canRenew ? (
              <Button onClick={() => setModalOpen(true)}>Request Renewal</Button>
            ) : (
              <p className="text-sm text-slate-500">
                Renewal becomes available two months before your account expires.
              </p>
            )}
          </Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Account Renewal">
        {error ? <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          {isAgent ? (
            <FileUpload label="KPL Form" docType="KPL" ownerType="RENEWAL" required onUploaded={(r) => setKplDoc(r?.documentId ?? null)} />
          ) : null}
          <FileUpload label="SSM Form" docType="SSM" ownerType="RENEWAL" required onUploaded={(r) => setSsmDoc(r?.documentId ?? null)} />
          <p className="text-xs text-slate-500">File must comply with specified conditions to be submitted.</p>
          {isAgent ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  KPL License Number<span className="text-red-500">*</span>
                </label>
                <Input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  KPL Expiry Date (Minimum 2 months before expiry)<span className="text-red-500">*</span>
                </label>
                <Input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} required />
              </div>
            </>
          ) : null}
          <Button className="w-full" onClick={submitRenewal} disabled={busy}>
            {busy ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </Modal>
    </ProtectedShell>
  );
}

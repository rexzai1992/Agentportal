"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading";
import { StatusUpdatePanel, type VerificationDecision } from "@/components/shared/status-update-panel";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface RegistrationDetail {
  id: string;
  applicationId: string;
  partyType: "AGENT" | "PARTNER";
  companyName: string;
  registrationNo: string;
  email: string;
  kplLicenseNo: string | null;
  kplExpiryDate: string | null;
  contactNo: string;
  fax: string | null;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string | null;
  postcode: string;
  country: string;
  state: string;
  targetMarket: string | null;
  salesChannel: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION";
  remarks: string | null;
  contactPersons: Array<{ id: string; name: string; email: string | null; phone: string | null }>;
  documents: Array<{ id: string; docType: string; fileName: string }>;
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-800">{value || "-"}</p>
  </div>
);

export default function RegistrationReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<RegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await apiFetch<RegistrationDetail>(`/api/registrations/${params.id}`);
      setData(detail);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onVerify = async (decision: VerificationDecision, remarks: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await apiFetch<{ status: string; accountCode?: string }>(
        `/api/registrations/${params.id}/verify`,
        { method: "PUT", body: JSON.stringify({ decision, remarks }) }
      );
      setMessage(
        result.accountCode
          ? `Approved. Account created: ${result.accountCode}`
          : `Application marked ${result.status}.`
      );
      setTimeout(() => router.push(`/admin/registrations/${data?.partyType === "PARTNER" ? "partners" : "agents"}`), 1200);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedShell roles={["ADMIN"]} title="Review Request" subtitle="Registration application">
      {loading || !data ? (
        <LoadingState label="Loading application..." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="section-title">Application {data.applicationId}</h3>
                <Badge tone={data.status === "APPROVED" ? "success" : data.status === "REJECTED" ? "danger" : "warning"}>
                  {data.status}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label="Company Name" value={data.companyName} />
                <Row label="Registration No" value={data.registrationNo} />
                <Row label="Email" value={data.email} />
                <Row label="Contact No" value={data.contactNo} />
                <Row label="KPL License No" value={data.kplLicenseNo} />
                <Row label="KPL Expiry" value={data.kplExpiryDate ? formatDate(data.kplExpiryDate) : "-"} />
                <Row label="Fax" value={data.fax} />
                <Row label="Address" value={[data.addressLine1, data.addressLine2, data.addressLine3, data.postcode, data.state, data.country].filter(Boolean).join(", ")} />
                <Row label="Target Market" value={data.targetMarket} />
                <Row label="Sales Channel" value={data.salesChannel} />
              </div>
            </Card>

            <Card>
              <h3 className="section-title mb-3">Company Registration Documents</h3>
              {data.documents.length === 0 ? (
                <p className="text-sm text-slate-400">No documents uploaded.</p>
              ) : (
                <ul className="space-y-2">
                  {data.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2 text-sm">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {doc.docType}
                      </span>
                      <a
                        href={`/api/documents/${doc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline"
                      >
                        {doc.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h3 className="section-title mb-3">Contact Person Information</h3>
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
            {data.status === "APPROVED" ? (
              <Card>
                <p className="text-sm text-emerald-700">This application has been approved.</p>
              </Card>
            ) : (
              <StatusUpdatePanel submitting={submitting} onSubmit={onVerify} />
            )}
            {message ? (
              <Card>
                <p className="text-sm text-slate-700">{message}</p>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </ProtectedShell>
  );
}

"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";

interface StatusResult {
  applicationId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION";
  remarks: string | null;
  companyName: string;
  submissionDate: string;
}

const statusTone: Record<StatusResult["status"], "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REVISION: "warning"
};

const statusMessage: Record<StatusResult["status"], string> = {
  PENDING: "Your application is currently under review. No further action is required at this stage.",
  APPROVED: "Your application is approved. Please check your email for login credentials.",
  REJECTED: "Your application has been rejected. Please check your email for details.",
  REVISION: "Additional information is required. Please check your email and resubmit."
};

export default function ApplicationStatusPage() {
  const [applicationId, setApplicationId] = useState("");
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await apiFetch<StatusResult>(
        `/api/applications/status?applicationId=${encodeURIComponent(applicationId.trim())}`
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-8">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Application Status</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your Application ID to check your registration status.
        </p>

        <form className="mt-5 flex gap-2" onSubmit={onSubmit}>
          <Input
            placeholder="Enter application id"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "..." : "Submit"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setApplicationId(""); setResult(null); setError(null); }}>
            Reset
          </Button>
        </form>

        {error ? <p className="mt-4 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

        {result ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Your application status is</span>
              <Badge tone={statusTone[result.status]}>{result.status}</Badge>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-800">Application Details</p>
              <p className="mt-1 text-slate-600">Application ID: {result.applicationId}</p>
              <p className="text-slate-600">Company: {result.companyName}</p>
              <p className="text-slate-600">Submission Date: {formatDate(result.submissionDate)}</p>
              <p className="text-slate-600">Remarks: {result.remarks || "-"}</p>
            </div>
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              {statusMessage[result.status]}
            </p>
          </div>
        ) : null}

        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-emerald-600">
          Back to Login
        </Link>
      </Card>
    </div>
  );
}

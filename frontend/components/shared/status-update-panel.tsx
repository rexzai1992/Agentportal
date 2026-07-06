"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export type VerificationDecision = "APPROVED" | "REJECTED" | "REVISION";

interface StatusUpdatePanelProps {
  title?: string;
  submitting?: boolean;
  /** Labels for the approve option (e.g. "Approve", "Order Confirmed"). */
  approveLabel?: string;
  onSubmit: (decision: VerificationDecision, remarks: string) => void | Promise<void>;
}

const DECISIONS: { value: VerificationDecision; label: string; needsRemarks: boolean }[] = [
  { value: "APPROVED", label: "Approve", needsRemarks: false },
  { value: "REJECTED", label: "Rejected", needsRemarks: true },
  { value: "REVISION", label: "Revision", needsRemarks: true }
];

export const StatusUpdatePanel = ({
  title = "Verification",
  submitting,
  approveLabel,
  onSubmit
}: StatusUpdatePanelProps) => {
  const [decision, setDecision] = useState<VerificationDecision | "">("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const current = DECISIONS.find((d) => d.value === decision);

  const handleSubmit = async () => {
    setError(null);
    if (!decision) {
      setError("Please select a status");
      return;
    }
    if (current?.needsRemarks && !remarks.trim()) {
      setError("Remarks are required for Rejected and Revision");
      return;
    }
    await onSubmit(decision, remarks.trim());
    setRemarks("");
    setDecision("");
  };

  return (
    <Card>
      <h3 className="section-title mb-3">{title}</h3>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status *</label>
          <Select value={decision} onChange={(e) => setDecision(e.target.value as VerificationDecision)}>
            <option value="">Please Select...</option>
            {DECISIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.value === "APPROVED" && approveLabel ? approveLabel : d.label}
              </option>
            ))}
          </Select>
        </div>

        {current?.needsRemarks ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Review Remarks *</label>
            <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        ) : null}

        {error ? <p className="rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </Card>
  );
};

"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";

export default function DocumentationPage() {
  return (
    <ProtectedShell roles={["AGENT"]} title="Documentation" subtitle="User guide">
      <Card>
        <h3 className="section-title mb-3">User Guide</h3>
        <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600">
          <li>Register as an Agent or Partner from the login page and submit your documents.</li>
          <li>Once approved, log in with the account code and temporary password emailed to you.</li>
          <li>Change your password on first login.</li>
          <li>Buy tickets under Ticket Purchase, then pay offline by uploading your bank slip.</li>
          <li>Track incomplete orders, issued vouchers, and reports from the sidebar.</li>
          <li>Renew your account from Profile within two months of expiry.</li>
        </ol>
      </Card>
    </ProtectedShell>
  );
}

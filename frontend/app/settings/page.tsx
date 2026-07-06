"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

export default function SettingsPage() {
  const { user } = useSession(["ADMIN", "AGENT", "STAFF"]);

  return (
    <ProtectedShell
      roles={["ADMIN", "AGENT", "STAFF"]}
      title="Settings"
      subtitle="Profile and operational guidance"
    >
      <section className="bento-grid lg:grid-cols-2">
        <Card>
          <h3 className="section-title">Profile</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="font-semibold text-slate-700">Name:</span> {user?.fullName ?? "-"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Email:</span> {user?.email ?? "-"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Role:</span> {user?.role ?? "-"}
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">Usage Tips</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>1. Keep booking references short and easy to search.</p>
            <p>2. Check invoices daily to avoid overdue balances.</p>
            <p>3. For scanner role, always allow camera permission on first launch.</p>
          </div>
        </Card>
      </section>
    </ProtectedShell>
  );
}

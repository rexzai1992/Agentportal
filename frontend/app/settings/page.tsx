"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/fetcher";
import { useSession, clearSessionCache } from "@/hooks/use-session";

const RULES = [
  { label: "Minimum 5 characters", test: (v: string) => v.length >= 5 },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) }
];

const ChangePasswordCard = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allValid = RULES.every((r) => r.test(newPassword));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!allValid) {
      setError("Password does not meet the requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiFetch<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword, confirmPassword })
      });
      clearSessionCache();
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3 className="section-title">Change Password</h3>
      <p className="mt-1 text-xs text-slate-500">
        You will be asked to log in again after changing your password.
      </p>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <ul className="space-y-1 text-xs">
          {RULES.map((rule) => {
            const passed = rule.test(newPassword);
            return (
              <li key={rule.label} className={passed ? "text-emerald-600" : "text-slate-400"}>
                {passed ? "✓" : "○"} {rule.label}
              </li>
            );
          })}
        </ul>
        {error ? <p className="rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Change Password"}
        </Button>
      </form>
    </Card>
  );
};

export default function SettingsPage() {
  const { user } = useSession(["ADMIN", "AGENT", "STAFF", "FINANCE"]);

  return (
    <ProtectedShell
      roles={["ADMIN", "AGENT", "STAFF", "FINANCE"]}
      title="Settings"
      subtitle="Profile and account security"
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

        <ChangePasswordCard />
      </section>
    </ProtectedShell>
  );
}

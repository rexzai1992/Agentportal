"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/fetcher";
import { clearSessionCache } from "@/hooks/use-session";

const RULES = [
  { label: "Minimum 5 characters", test: (v: string) => v.length >= 5 },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) }
];

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Change Password</h1>
        <p className="mt-1 text-sm text-slate-500">Set a new password to continue.</p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs">
            {RULES.map((rule) => (
              <p
                key={rule.label}
                className={rule.test(newPassword) ? "text-emerald-600" : "text-slate-500"}
              >
                {rule.test(newPassword) ? "✓" : "○"} {rule.label}
              </p>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p className="rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/fetcher";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setInfo(null);
    setError(null);

    try {
      const result = await apiFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ username, email })
      });
      setInfo(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="bento-card p-6">
        <h1 className="text-xl font-bold text-slate-900">Forgot your password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the username and email for the account you&apos;d like to reset.
        </p>

        <form className="mt-5 space-y-4" onSubmit={requestReset}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Skeleton className="h-4 w-28 bg-white/70" /> : "Reset Password"}
          </Button>
        </form>

        {info ? (
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{info}</p>
        ) : null}
        {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-emerald-600">
          Back to Login
        </Link>
      </section>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/fetcher";

interface LoginResponse {
  user: {
    role: "ADMIN" | "AGENT" | "STAFF" | "FINANCE";
    mustChangePassword?: boolean;
  };
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
      });

      if (data.user.mustChangePassword) {
        router.replace("/change-password");
        return;
      }

      if (data.user.role === "ADMIN") router.replace("/admin/dashboard");
      else if (data.user.role === "AGENT") router.replace("/agent/dashboard");
      else if (data.user.role === "FINANCE") router.replace("/finance/offline-payments");
      else router.replace("/scanner");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="bento-grid relative w-full max-w-5xl md:grid-cols-[1.1fr_0.9fr]">
        <section className="bento-card bg-[linear-gradient(145deg,rgba(16,185,129,0.13),rgba(15,23,42,0.05))] p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Travel Agent Portal
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Only The Best</h1>
          <p className="mt-2 text-sm text-slate-600">
            Register as an agent or partner, buy tickets and manage your account in one workspace.
          </p>

          <div className="mt-6 grid gap-3">
            <Link href="/register/agent">
              <Button className="w-full" variant="secondary">
                Become an Agent
              </Button>
            </Link>
            <Link href="/register/partner">
              <Button className="w-full" variant="secondary">
                Become a Partner
              </Button>
            </Link>
            <Link href="/application-status">
              <Button className="w-full" variant="ghost">
                Check Application Status
              </Button>
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-white/85 p-4 text-sm text-slate-600 ring-1 ring-white/70">
            <p className="font-semibold text-slate-800">Demo Credentials</p>
            <p className="mt-2">admin@travel-agent.demo / admin123!</p>
            <p>Agent username A20260001 / agent123!</p>
            <p>Partner username P20260001 / partner123!</p>
            <p>finance@travel-agent.demo / finance123!</p>
          </div>
        </section>

        <section className="bento-card p-7">
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back!</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in with your account username.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <Input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="e.g. A20260001"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
              />
            </div>

            {error ? <p className="rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Skeleton className="h-4 w-20 bg-white/70" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Forgot password?
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

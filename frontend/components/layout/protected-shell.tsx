"use client";

import { useSession } from "@/hooks/use-session";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui/loading";

interface ProtectedShellProps {
  roles: Array<"ADMIN" | "AGENT" | "STAFF" | "FINANCE">;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ProtectedShell = ({ roles, title, subtitle, children }: ProtectedShellProps) => {
  const { loading, user } = useSession(roles);

  if (loading || !user) {
    return <LoadingState label="Loading secure workspace..." />;
  }

  return (
    <AppShell user={user} title={title} subtitle={subtitle}>
      {children}
    </AppShell>
  );
};

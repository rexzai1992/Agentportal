import { ProtectedShell } from "@/components/layout/protected-shell";
import { ComplimentaryRequests } from "@/components/shared/complimentary-requests";

export default function ComplimentaryApprovalsPage() {
  return <ProtectedShell roles={["FINANCE"]} title="Complimentary Approvals" subtitle="Review requests before free tickets are issued">
    <ComplimentaryRequests review />
  </ProtectedShell>;
}

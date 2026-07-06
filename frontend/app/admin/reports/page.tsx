"use client";

import Link from "next/link";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";

const REPORTS = [
  { href: "/admin/reports/transaction", label: "Transaction Report", desc: "All portal transactions" },
  { href: "/admin/reports/transaction-details", label: "Transaction Details", desc: "Line-item transactions" },
  { href: "/admin/reports/purchase-summary", label: "Purchase Summary", desc: "All purchases with payment & approval info" },
  { href: "/admin/reports/purchase-details", label: "Purchase Details", desc: "Product, quantity and price per purchase" },
  { href: "/admin/reports/top-purchase", label: "Top Purchase", desc: "Most purchased products" },
  { href: "/admin/reports/voucher-issued", label: "Voucher Issued", desc: "Issued / used / available vouchers" },
  { href: "/admin/reports/ticket", label: "Ticket", desc: "Search a ticket by serial no or QR" },
  { href: "/admin/reports/complimentary", label: "Complimentary", desc: "Complimentary grants" },
  { href: "/admin/reports/payment", label: "Payment", desc: "Payment transactions" }
];

export default function AdminReportsPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Reports" subtitle="Generate and export reports">
      <div className="bento-grid sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full transition hover:ring-2 hover:ring-emerald-200">
              <h3 className="section-title">{r.label}</h3>
              <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </ProtectedShell>
  );
}

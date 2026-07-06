import Link from "next/link";
import { Card } from "@/components/ui/card";

const actions = [
  { href: "/agents", label: "Add Agent" },
  { href: "/products", label: "Add Product" },
  { href: "/agents", label: "Top Up Agent" },
  { href: "/invoices", label: "Generate Invoice" },
  { href: "/scanner", label: "Open Scanner" },
  { href: "/reports", label: "Export Report" }
];

export const QuickActions = () => (
  <Card>
    <h3 className="section-title">Quick Actions</h3>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-700"
        >
          {action.label}
        </Link>
      ))}
    </div>
  </Card>
);

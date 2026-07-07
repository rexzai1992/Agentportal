import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  /** When set, the whole card becomes a link to this page. */
  href?: string;
}

const toneClass: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-slate-900",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600"
};

export const StatCard = ({ label, value, hint, tone = "default", href }: StatCardProps) => {
  const body = (
    <Card
      className={`rounded-3xl ${
        href ? "h-full transition hover:-translate-y-0.5 hover:bg-emerald-50/60 hover:shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {href ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
      </div>
      <p className={`mt-2 text-2xl font-extrabold sm:text-3xl ${toneClass[tone]}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
};

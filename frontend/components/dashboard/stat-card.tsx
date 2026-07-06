import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClass: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-slate-900",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600"
};

export const StatCard = ({ label, value, hint, tone = "default" }: StatCardProps) => (
  <Card className="rounded-3xl">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className={`mt-2 text-2xl font-extrabold sm:text-3xl ${toneClass[tone]}`}>{value}</p>
    {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
  </Card>
);

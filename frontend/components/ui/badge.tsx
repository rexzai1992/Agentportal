import { cn } from "@/lib/utils";

export type BadgeTone = "default" | "success" | "warning" | "danger" | "info" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
}

const toneClass: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  purple: "bg-violet-100 text-violet-700"
};

export const Badge = ({ children, tone = "default" }: BadgeProps) => (
  <span className={cn("badge whitespace-nowrap", toneClass[tone])}>{children}</span>
);

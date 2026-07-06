import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-400 text-white shadow-[0_10px_24px_-14px_rgba(52,211,153,0.95)] hover:bg-emerald-500",
  secondary:
    "bg-slate-900 text-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.95)] hover:bg-slate-800",
  ghost: "bg-white/90 text-slate-700 ring-1 ring-slate-200 hover:bg-white",
  danger: "bg-red-600 text-white shadow-[0_10px_24px_-14px_rgba(220,38,38,0.95)] hover:bg-red-700"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

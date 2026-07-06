import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = ({ label, className, id, ...props }: CheckboxProps) => (
  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
    <input
      id={id}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400",
        className
      )}
      {...props}
    />
    {label ? <span>{label}</span> : null}
  </label>
);

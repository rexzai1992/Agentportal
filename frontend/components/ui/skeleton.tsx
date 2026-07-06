import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("animate-pulse rounded-xl bg-slate-200/80", className)}
    aria-hidden="true"
    {...props}
  />
);

"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, active, onChange, className }: TabsProps) => (
  <div className={cn("inline-flex rounded-2xl bg-slate-100 p-1", className)}>
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-semibold transition",
          active === tab.key
            ? "bg-white text-emerald-700 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

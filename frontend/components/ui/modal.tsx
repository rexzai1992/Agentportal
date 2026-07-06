"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ open, onClose, title, children, className }: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
};

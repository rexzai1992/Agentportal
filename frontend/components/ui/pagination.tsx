"use client";

import { Button } from "@/components/ui/button";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, pageSize, total, onPageChange }: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        Page {page} of {totalPages} · {total} record{total === 1 ? "" : "s"}
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 px-3"
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 px-3"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

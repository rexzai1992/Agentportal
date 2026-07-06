import { Skeleton } from "@/components/ui/skeleton";

export const LoadingState = ({ label = "Loading..." }: { label?: string }) => (
  <div className="space-y-3" role="status" aria-live="polite" aria-label={label}>
    <p className="sr-only">{label}</p>

    <Skeleton className="h-5 w-48" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

import { LoadingState } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="min-h-screen px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto w-full max-w-[1480px]">
        <LoadingState label="Loading page..." />
      </div>
    </div>
  );
}

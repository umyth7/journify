import { Skeleton } from "@/components/ui/skeleton";

export function SetCardSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

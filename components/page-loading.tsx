import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading({
  sections = 3
}: {
  sections?: number;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: sections }).map((_, index) => (
          <div key={index} className="rounded-[28px] border border-slate-200/70 bg-white p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-6 h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}


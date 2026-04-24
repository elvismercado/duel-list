import { Skeleton } from '@/components/ui/skeleton';

export function DefaultSkeleton() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-3" aria-busy="true" aria-live="polite">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function RankingsSkeleton() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <ul className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card/40"
          >
            <Skeleton className="h-5 w-7 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </li>
        ))}
      </ul>
    </div>
  );
}

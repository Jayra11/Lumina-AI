import { Skeleton } from "@/components/ui/skeleton";

export function DocumentCardSkeleton() {
  return (
    <div className="p-6 border border-slate-200 rounded-lg space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-4 h-4" />
      </div>
      <Skeleton className="w-full h-5" />
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-24 h-3" />
      <Skeleton className="w-full h-9" />
    </div>
  );
}

export function DocumentLibrarySkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-full h-12" />
      <Skeleton className="w-3/4 h-4" />
    </div>
  );
}

export function ChatInterfaceSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-4 overflow-y-auto">
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
      </div>
      <div className="p-4 border-t">
        <Skeleton className="w-full h-12" />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-16 h-8" />
            </div>
            <Skeleton className="w-12 h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

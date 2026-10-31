import { GridSkeleton } from "@/components/loading/skeletons/GridSkeleton";
import { GlobalLoader } from "@/components/loading/GlobalLoader";

export default function Loading() {
  return (
    <div className="w-full">
      <div className="pointer-events-none w-full" aria-hidden="true">
        <GridSkeleton />
      </div>
      <div className="fixed top-0 left-0 md:left-64 right-0 bottom-0 z-[100] flex items-center justify-center pointer-events-none">
        <GlobalLoader message="Loading progress..." size={120} />
      </div>
    </div>
  );
}

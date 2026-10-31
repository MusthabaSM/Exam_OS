import { SettingsSkeleton } from "@/components/loading/skeletons/SettingsSkeleton";
import { GlobalLoader } from "@/components/loading/GlobalLoader";

export default function Loading() {
  return (
    <div className="w-full">
      <div className="pointer-events-none w-full" aria-hidden="true">
        <SettingsSkeleton />
      </div>
      <div className="fixed top-0 left-0 md:left-64 right-0 bottom-0 z-[100] flex items-center justify-center pointer-events-none">
        <GlobalLoader message="Loading settings..." size={120} />
      </div>
    </div>
  );
}

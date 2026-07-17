"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type SearchScheduleViewModel,
  type UseSearchScheduleViewModelProps,
  useSearchScheduleViewModel,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";

export type { SearchScheduleViewModel };

const lazyViews = createLazyView<SearchScheduleViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/search-schedule/searchSchedule.mobile").then(m => ({
      default: m.SearchScheduleMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/search-schedule/searchSchedule.desktop").then(m => ({
      default: m.SearchScheduleDesktopView,
    }))
);

export function SearchScheduleView(props: Readonly<UseSearchScheduleViewModelProps>) {
  const viewModel = useSearchScheduleViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

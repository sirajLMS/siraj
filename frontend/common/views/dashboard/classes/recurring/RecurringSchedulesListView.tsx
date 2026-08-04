"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { RecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringSchedulesListViewModel";

const lazyViews = createLazyView<RecurringSchedulesListViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/recurring/recurringSchedulesListView.mobile").then(m => ({
      default: m.RecurringSchedulesListMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/recurring/recurringSchedulesListView.desktop").then(m => ({
      default: m.RecurringSchedulesListDesktopView,
    }))
);

export function RecurringSchedulesListView(props: Readonly<RecurringSchedulesListViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

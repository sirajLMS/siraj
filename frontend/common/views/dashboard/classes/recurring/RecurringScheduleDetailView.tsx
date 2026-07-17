"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  RecurringScheduleDetailViewModel,
  UseRecurringScheduleDetailViewModelProps,
} from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";

const lazyViews = createLazyView<RecurringScheduleDetailViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/recurring/recurringScheduleDetailView.mobile").then(m => ({
      default: m.RecurringScheduleDetailMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/recurring/recurringScheduleDetailView.desktop").then(m => ({
      default: m.RecurringScheduleDetailDesktopView,
    }))
);

export function RecurringScheduleDetailView(props: Readonly<RecurringScheduleDetailViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { RecurringScheduleDetailViewModel, UseRecurringScheduleDetailViewModelProps };

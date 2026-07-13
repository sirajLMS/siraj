"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ReportsViewModel,
  type UseReportsViewModelProps,
  useReportsViewModel,
} from "@/frontend/views/dashboard/reports/useReportsViewModel";

export type { ReportsViewModel };

const lazyViews = createLazyView<ReportsViewModel>(
  () =>
    import("@/frontend/views/dashboard/reports/mobile/reports.mobile").then(m => ({ default: m.ReportsMobileView })),
  () =>
    import("@/frontend/views/dashboard/reports/desktop/reports.desktop").then(m => ({ default: m.ReportsDesktopView }))
);

export function ReportsView(props: Readonly<UseReportsViewModelProps>) {
  const viewModel = useReportsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

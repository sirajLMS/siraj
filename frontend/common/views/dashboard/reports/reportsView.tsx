"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ReportsViewModel,
  type UseReportsViewModelProps,
  useReportsViewModel,
} from "@/frontend/common/views/dashboard/reports/useReportsViewModel";

export type { ReportsViewModel };

const lazyViews = createLazyView<ReportsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/reports/reports.mobile").then(m => ({ default: m.ReportsMobileView })),
  () =>
    import("@/frontend/desktop/views/dashboard/reports/reports.desktop").then(m => ({ default: m.ReportsDesktopView }))
);

export function ReportsView(props: Readonly<UseReportsViewModelProps>) {
  const viewModel = useReportsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

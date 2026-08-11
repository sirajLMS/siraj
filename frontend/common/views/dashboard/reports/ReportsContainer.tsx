"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ReportsViewModel,
  useReportsViewModel,
} from "@/frontend/common/views/dashboard/reports/useReportsViewModel";

const lazyViews = createLazyView<ReportsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/reports/reports.mobile").then(m => ({ default: m.ReportsMobileView })),
  () =>
    import("@/frontend/desktop/views/dashboard/reports/reports.desktop").then(m => ({ default: m.ReportsDesktopView }))
);

export function ReportsContainer() {
  const viewModel = useReportsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

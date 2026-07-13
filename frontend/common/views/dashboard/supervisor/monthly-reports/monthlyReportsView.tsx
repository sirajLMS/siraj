"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type MonthlyReportsViewModel,
  type UseMonthlyReportsViewModelProps,
  useMonthlyReportsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/useMonthlyReportsViewModel";

export type { MonthlyReportsViewModel };

const lazyViews = createLazyView<MonthlyReportsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/monthly-reports/monthlyReports.mobile").then(m => ({
      default: m.MonthlyReportsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/monthly-reports/monthlyReports.desktop").then(m => ({
      default: m.MonthlyReportsDesktopView,
    }))
);

export function MonthlyReportsView(props: Readonly<UseMonthlyReportsViewModelProps>) {
  const viewModel = useMonthlyReportsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

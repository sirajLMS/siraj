"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type MonthlyReportsViewModel,
  useMonthlyReportsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/useMonthlyReportsViewModel";

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

export function MonthlyReportsContainer() {
  const viewModel = useMonthlyReportsViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { MonthlyReportsViewModel };

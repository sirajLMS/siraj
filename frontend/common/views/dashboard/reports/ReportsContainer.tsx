"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ReportsViewModel,
  type UseReportsViewModelProps,
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
  return (
    <RequirePermission permissions={[AppPermission.ReportGenerateCustom]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}
export type { ReportsViewModel, UseReportsViewModelProps };

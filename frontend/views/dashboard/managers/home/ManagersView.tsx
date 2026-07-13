"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  Manager,
  ManagerRoleFilter,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/views/dashboard/managers/home/types";

interface ManagersViewProps {
  readonly managers: readonly Manager[];
  readonly metrics: NonNullableManagerDirectoryMetrics;
  readonly totalManagers?: number;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly onPageChange?: (page: number) => void;
  readonly roleFilter: ManagerRoleFilter;
  readonly statusFilter: ManagerStatusFilter;
  readonly onRoleFilterChange: (role: ManagerRoleFilter) => void;
  readonly onStatusFilterChange: (status: ManagerStatusFilter) => void;
}

const lazyViews = createLazyView<ManagersViewProps>(
  () =>
    import("@/frontend/views/dashboard/managers/home/managersView.mobile").then(m => ({
      default: m.ManagersViewMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/managers/home/managersView.desktop").then(m => ({
      default: m.ManagersViewDesktop,
    }))
);

export function ManagersView(props: Readonly<ManagersViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

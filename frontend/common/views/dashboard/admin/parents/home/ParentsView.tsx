"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ParentCardListLabels,
  ParentDirectoryRow,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/directory";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import type { ParentLifecycleStatus } from "@/frontend/common/views/dashboard/types/parent.types";

export interface ParentsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly addParent: string;
  readonly records: string;
  readonly filterLabel: string;
  readonly clearFilters: string;
  readonly table: ParentsDataGridLabels;
  readonly card: ParentCardListLabels;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
}

export interface ParentsViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsViewLabels;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly lifecycleStatusFilter: ParentStatus | null;
  readonly filterPanelOpen: boolean;
  readonly onAddParent: () => void;
  readonly onOpenSettings: (id: string) => void;
  readonly onSearch: (query: string) => void;
  readonly onPageChange?: (page: number) => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly onLifecycleStatusFilterChange: (status: ParentStatus | null) => void;
  readonly onResetFilters: () => void;
}

const lazyViews = createLazyView<ParentsViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/parents/home/parentsView.mobile").then(m => ({
      default: m.ParentsViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/parents/home/parentsView.desktop").then(m => ({
      default: m.ParentsViewDesktop,
    }))
);

export function ParentsView(props: Readonly<ParentsViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

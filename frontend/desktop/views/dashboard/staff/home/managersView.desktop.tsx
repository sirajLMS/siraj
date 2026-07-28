"use client";

import { ManagersFilterBar } from "@/frontend/common/views/dashboard/staff/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/common/views/dashboard/staff/home/ManagersMetrics";
import type { ManagersViewProps } from "@/frontend/common/views/dashboard/staff/home/types";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ManagersDataGridDesktop } from "@/frontend/desktop/views/dashboard/staff/home/components/managersDataGrid.desktop";
import { Link } from "@/shared/i18n";

export function ManagersViewDesktop({ labels, ...props }: Readonly<ManagersViewProps>) {
  const actions = props.canCreateManager ? (
    <Link href="/staff/create" style={{ textDecoration: "none" }}>
      <DesktopPrimaryPageAction>{labels.actions.addManager}</DesktopPrimaryPageAction>
    </Link>
  ) : undefined;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} actions={actions} />

      <ManagersMetrics labels={labels.metrics} metrics={props.metrics} />

      <DesktopSectionPanel>
        <ManagersFilterBar
          labels={labels.filters}
          roleFilter={props.roleFilter}
          statusFilter={props.statusFilter}
          onRoleFilterChange={props.onRoleFilterChange}
          onStatusFilterChange={props.onStatusFilterChange}
        />

        <ManagersDataGridDesktop
          labels={labels}
          managers={[...props.managers]}
          page={props.page}
          pageSize={props.pageSize}
          totalCount={props.totalManagers}
          onPageChange={props.onPageChange}
          loading={props.loading}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}

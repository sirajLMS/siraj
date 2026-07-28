"use client";

import { ManagersFilterBar } from "@/frontend/common/views/dashboard/staff/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/common/views/dashboard/staff/home/ManagersMetrics";
import type { ManagersViewProps } from "@/frontend/common/views/dashboard/staff/home/types";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ManagersDataGridDesktop } from "@/frontend/desktop/views/dashboard/staff/home/components/managersDataGrid.desktop";
import { Link } from "@/shared/i18n";
import { useAppTranslation } from "@/shared/locale";

export function ManagersViewDesktop(props: Readonly<ManagersViewProps>) {
  const t = useAppTranslation().dashboardTranslations.staffDirectory;

  const actions = props.canCreateManager ? (
    <Link href="/staff/create" style={{ textDecoration: "none" }}>
      <DesktopPrimaryPageAction>{t.actions.addManager}</DesktopPrimaryPageAction>
    </Link>
  ) : undefined;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.pageTitle} subtitle={t.pageSubtitle} actions={actions} />

      <ManagersMetrics metrics={props.metrics} />

      <DesktopSectionPanel>
        <ManagersFilterBar
          roleFilter={props.roleFilter}
          statusFilter={props.statusFilter}
          onRoleFilterChange={props.onRoleFilterChange}
          onStatusFilterChange={props.onStatusFilterChange}
        />

        <ManagersDataGridDesktop
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

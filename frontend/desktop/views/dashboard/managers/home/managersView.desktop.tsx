import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ManagersFilterBar } from "@/frontend/common/views/dashboard/managers/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/common/views/dashboard/managers/home/ManagersMetrics";
import type {
  Manager,
  ManagerRoleFilter,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/common/views/dashboard/managers/home/types";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ManagersDataGridDesktop } from "@/frontend/desktop/views/dashboard/managers/home/components/managersDataGrid.desktop";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

interface ManagersViewDesktopProps {
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

export function ManagersViewDesktop({
  managers,
  metrics,
  totalManagers,
  loading,
  page,
  pageSize,
  onPageChange,
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
}: Readonly<ManagersViewDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.managersDirectory;

  const actions = (
    <RequirePermission permissions={[AppPermission.StaffCreate]}>
      <Link href="/managers/onboarding" style={{ textDecoration: "none" }}>
        <DesktopPrimaryPageAction>{t.actions.addManager}</DesktopPrimaryPageAction>
      </Link>
    </RequirePermission>
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.pageTitle} subtitle={t.pageSubtitle} actions={actions} />

      <ManagersMetrics metrics={metrics} />

      <DesktopSectionPanel>
        <ManagersFilterBar
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilterChange={onRoleFilterChange}
          onStatusFilterChange={onStatusFilterChange}
        />

        <ManagersDataGridDesktop
          managers={managers as Manager[]}
          page={page}
          pageSize={pageSize}
          totalCount={totalManagers}
          onPageChange={onPageChange}
          loading={loading}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ManagersDataGrid } from "@/frontend/common/views/dashboard/managers/home/ManagersDataGrid";
import { ManagersFilterBar } from "@/frontend/common/views/dashboard/managers/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/common/views/dashboard/managers/home/ManagersMetrics";
import type {
  Manager,
  ManagerRoleFilter,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/common/views/dashboard/managers/home/types";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";

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
        <PrimaryPageAction>{t.actions.addManager}</PrimaryPageAction>
      </Link>
    </RequirePermission>
  );

  return (
    <PageContainer>
      <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} actions={actions} />

      <ManagersMetrics metrics={metrics} />

      <SectionPanel>
        <ManagersFilterBar
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilterChange={onRoleFilterChange}
          onStatusFilterChange={onStatusFilterChange}
        />

        <ManagersDataGrid
          managers={managers as Manager[]}
          page={page}
          pageSize={pageSize}
          totalCount={totalManagers}
          onPageChange={onPageChange}
          loading={loading}
        />
      </SectionPanel>
    </PageContainer>
  );
}

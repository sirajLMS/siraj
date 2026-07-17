import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ManagersFilterBar } from "@/frontend/common/views/dashboard/managers/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/common/views/dashboard/managers/home/ManagersMetrics";
import type {
  Manager,
  ManagerRoleFilter,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/common/views/dashboard/managers/home/types";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ManagersCardListMobile } from "@/frontend/mobile/views/dashboard/managers/home/components/managersCardList.mobile";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

interface ManagersViewMobileProps {
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

export function ManagersViewMobile({
  managers,
  metrics,
  totalManagers,
  page,
  pageSize,
  onPageChange,
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
}: Readonly<ManagersViewMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.managersDirectory;

  const actions = (
    <RequirePermission permissions={[AppPermission.StaffCreate]}>
      <Link href="/managers/onboarding" style={{ textDecoration: "none" }}>
        <PrimaryPageAction>{t.actions.addManager}</PrimaryPageAction>
      </Link>
    </RequirePermission>
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.mobileTitle} subtitle={t.pageSubtitle} actions={actions} />

      <ManagersMetrics metrics={metrics} />

      <SectionPanel>
        <ManagersFilterBar
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilterChange={onRoleFilterChange}
          onStatusFilterChange={onStatusFilterChange}
        />

        <ManagersCardListMobile
          managers={managers as Manager[]}
          page={page}
          pageSize={pageSize}
          totalCount={totalManagers}
          onPageChange={onPageChange}
        />
      </SectionPanel>
    </MobilePageContainer>
  );
}

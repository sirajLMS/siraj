import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ManagersCardList } from "@/frontend/views/dashboard/managers/home/ManagersCardList";
import { ManagersFilterBar } from "@/frontend/views/dashboard/managers/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/views/dashboard/managers/home/ManagersMetrics";
import type {
  Manager,
  ManagerRoleFilter,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/views/dashboard/managers/home/types";
import { Link } from "@/shared/i18n/routing";

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
  const t = useTranslations("dashboard.managersDirectory");

  const actions = (
    <RequirePermission permissions={[AppPermission.StaffCreate]}>
      <Link href="/managers/onboarding" style={{ textDecoration: "none" }}>
        <PrimaryPageAction>{t("actions.addManager")}</PrimaryPageAction>
      </Link>
    </RequirePermission>
  );

  return (
    <PageContainer>
      <MobilePageHeader title={t("mobileTitle")} subtitle={t("pageSubtitle")} actions={actions} />

      <ManagersMetrics metrics={metrics} />

      <SectionPanel>
        <ManagersFilterBar
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilterChange={onRoleFilterChange}
          onStatusFilterChange={onStatusFilterChange}
        />

        <ManagersCardList
          managers={managers as Manager[]}
          page={page}
          pageSize={pageSize}
          totalCount={totalManagers}
          onPageChange={onPageChange}
        />
      </SectionPanel>
    </PageContainer>
  );
}

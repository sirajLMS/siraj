import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { ManagersCardList } from "@/frontend/views/dashboard/managers/home/ManagersCardList";
import { ManagersDataGrid } from "@/frontend/views/dashboard/managers/home/ManagersDataGrid";
import { ManagersFilterBar } from "@/frontend/views/dashboard/managers/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/views/dashboard/managers/home/ManagersMetrics";
import type {
  Manager,
  ManagerRoleFilter,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/views/dashboard/managers/home/types";
import { Link } from "@/shared/i18n/routing";

interface ManagersViewProps {
  managers: Manager[];
  metrics: NonNullableManagerDirectoryMetrics;
  totalManagers?: number;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  roleFilter: ManagerRoleFilter;
  statusFilter: ManagerStatusFilter;
  onRoleFilterChange: (role: ManagerRoleFilter) => void;
  onStatusFilterChange: (status: ManagerStatusFilter) => void;
}

export function ManagersView({
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
}: Readonly<ManagersViewProps>) {
  const t = useTranslations("dashboard.managersDirectory");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const actions = (
    <RequirePermission permissions={[AppPermission.StaffCreate]}>
      <Link href="/managers/onboarding" style={{ textDecoration: "none" }}>
        <PrimaryPageAction>{t("actions.addManager")}</PrimaryPageAction>
      </Link>
    </RequirePermission>
  );

  return (
    <PageContainer>
      <PageHeader title={isMobile ? t("mobileTitle") : t("pageTitle")} subtitle={t("pageSubtitle")} actions={actions} />

      <ManagersMetrics metrics={metrics} />

      <SectionPanel>
        <ManagersFilterBar
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilterChange={onRoleFilterChange}
          onStatusFilterChange={onStatusFilterChange}
        />

        <Box sx={{ width: "100%" }}>
          {isMobile ? (
            <ManagersCardList
              managers={managers}
              page={page}
              pageSize={pageSize}
              totalCount={totalManagers}
              onPageChange={onPageChange}
            />
          ) : (
            <ManagersDataGrid
              managers={managers}
              page={page}
              pageSize={pageSize}
              totalCount={totalManagers}
              onPageChange={onPageChange}
              loading={loading}
            />
          )}
        </Box>
      </SectionPanel>
    </PageContainer>
  );
}

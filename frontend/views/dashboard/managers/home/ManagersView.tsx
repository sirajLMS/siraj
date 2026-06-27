import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { Link } from "@/shared/i18n/routing";
import { ManagersCardList } from "./ManagersCardList";
import { ManagersDataGrid } from "./ManagersDataGrid";
import { ManagersFilterBar } from "./ManagersFilterBar";
import { ManagersMetrics } from "./ManagersMetrics";
import type { Manager } from "./types";

interface ManagersViewProps {
  managers: Manager[];
  metrics: {
    id: string;
    totalAdmin: number;
    systemStaff: number;
    activeNow: number;
    alerts: number;
  };
  totalManagers: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  roleFilter: "all" | "admin" | "staff";
  statusFilter: "all" | "active" | "offline";
  onRoleFilterChange: (role: "all" | "admin" | "staff") => void;
  onStatusFilterChange: (status: "all" | "active" | "offline") => void;
}

export function ManagersView({
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
}: Readonly<ManagersViewProps>) {
  const t = useTranslations("dashboard.managersDirectory");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const actions = (
    <Link href="/managers/onboarding" style={{ textDecoration: "none" }}>
      <PrimaryPageAction>{t("actions.addManager")}</PrimaryPageAction>
    </Link>
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
            />
          )}
        </Box>
      </SectionPanel>
    </PageContainer>
  );
}

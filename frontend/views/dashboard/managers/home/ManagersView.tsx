import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import type { Manager } from "@/frontend/stores/mockManagersStore";
import { Link } from "@/shared/i18n/routing";
import { ManagersCardList } from "./ManagersCardList";
import { ManagersDataGrid } from "./ManagersDataGrid";
import { ManagersFilterBar } from "./ManagersFilterBar";
import { ManagersMetrics } from "./ManagersMetrics";

interface ManagersViewProps {
  managers: Manager[];
  metrics: {
    totalAdmin: number;
    systemStaff: number;
    activeNow: number;
    alerts: number;
  };
  totalManagers: number;
  roleFilter: "all" | "admin" | "staff";
  statusFilter: "all" | "active" | "offline";
  onRoleFilterChange: (role: "all" | "admin" | "staff") => void;
  onStatusFilterChange: (status: "all" | "active" | "offline") => void;
}

export function ManagersView({
  managers,
  metrics,
  totalManagers,
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
            <ManagersCardList managers={managers} total={totalManagers} />
          ) : (
            <ManagersDataGrid managers={managers} total={totalManagers} />
          )}
        </Box>
      </SectionPanel>
    </PageContainer>
  );
}

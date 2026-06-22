import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { Link } from "@/shared/i18n/routing";
import { ManagersCardList } from "./ManagersCardList";
import { ManagersDataGrid } from "./ManagersDataGrid";
import { ManagersFilterBar } from "./ManagersFilterBar";
import { ManagersMetrics } from "./ManagersMetrics";
import type { Manager } from "./types";

/* ────────────────────────────────────────────────────────────────────────────
 * Component Interface
 * ──────────────────────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────────────────────
 * ManagersView Component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Main view component for the Managers Directory page.
 *
 * Structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ PageContainer                                               │
 * │  ├── PageHeader (title, subtitle, add manager action)       │
 * │  ├── ManagersMetrics (4 stat cards in grid)                 │
 * │  └── SectionPanel (bordered content area)                   │
 * │       ├── ManagersFilterBar (role/status dropdown filters)  │
 * │       └── Box (responsive container)                        │
 * │            ├── ManagersCardList (mobile view < md)          │
 * │            └── ManagersDataGrid (desktop view >= md)        │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Components:
 * - PageContainer: Main content wrapper with section spacing
 * - PageHeader: Page title, subtitle, and "Add Manager" action button
 * - ManagersMetrics: Grid of 4 MetricCards showing key stats
 * - SectionPanel: Bordered container for the table/list section
 * - ManagersFilterBar: Role and status filter dropdowns
 * - ManagersCardList: Mobile-optimized card list (shown on < md screens)
 * - ManagersDataGrid: Desktop data grid with columns (shown on >= md screens)
 *
 * @param managers - Filtered list of managers to display
 * @param metrics - Summary statistics for metrics cards
 * @param totalManagers - Total count before filtering (for pagination info)
 * @param roleFilter - Current role filter selection
 * @param statusFilter - Current status filter selection
 * @param onRoleFilterChange - Callback for role filter changes
 * @param onStatusFilterChange - Callback for status filter changes
 */
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
      {/* Page header with title, subtitle, and "Add Manager" action */}
      <PageHeader title={isMobile ? t("mobileTitle") : t("pageTitle")} subtitle={t("pageSubtitle")} actions={actions} />

      {/* Metrics overview: 4 stat cards (Admin, Staff, Active, Alerts) */}
      <ManagersMetrics metrics={metrics} />

      {/* Main content section with filters and data display */}
      <SectionPanel>
        {/* Filter controls: Role and Status dropdowns */}
        <ManagersFilterBar
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleFilterChange={onRoleFilterChange}
          onStatusFilterChange={onStatusFilterChange}
        />

        {/* Responsive data display: cards on mobile, grid on desktop */}
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

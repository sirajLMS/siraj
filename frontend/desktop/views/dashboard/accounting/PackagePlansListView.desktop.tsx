"use client";

import { StarOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { buildPackagePlansListColumns } from "@/frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop.columns";
import {
  buildPackagePlansMetricItems,
  getPackagePlansPriceLeader,
} from "@/frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop.helpers";

export function PackagePlansListDesktop(props: Readonly<PackagePlansListViewModel>) {
  const { t, rows, loading, error, activeCount, archivedCount, canManagePackages } = props;

  const priceLeader = useMemo(() => getPackagePlansPriceLeader(rows), [rows]);

  const columns = useMemo(() => buildPackagePlansListColumns({ t, canManagePackages }), [t, canManagePackages]);

  const metricItems = useMemo(
    () => buildPackagePlansMetricItems({ t, rows, activeCount, archivedCount, priceLeader }),
    [t, rows, activeCount, archivedCount, priceLeader]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          canManagePackages ? (
            <Link href="/accounting/packages/new" style={{ textDecoration: "none" }}>
              <DesktopPrimaryPageAction startIcon={<StarOutlined />}>{t.createPlan}</DesktopPrimaryPageAction>
            </Link>
          ) : null
        }
      />

      <DesktopMetricCardGrid metrics={metricItems} size={{ md: 3, lg: 3 }} />

      <DesktopSectionPanel contentPadding={false} title={t.pageTitle}>
        <DesktopListStateGate error={error} loading={loading} hasRows={rows.length > 0} errorMessage={t.loadError}>
          <Box
            sx={{
              width: "100%",
              height: 540,
              "& .archived-plan-row": {
                opacity: 0.62,
                filter: "grayscale(0.45)",
              },
            }}
          >
            <AppDataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              ariaLabel={t.pageTitle}
              emptyMessage={t.empty}
              getRowClassName={params => (params.row.active ? "" : "archived-plan-row")}
              autoHeight
              disableColumnMenu
              paginationOptions={{ mode: "client" }}
            />
          </Box>
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}

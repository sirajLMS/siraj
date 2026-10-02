"use client";

import { Box, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ErrorState } from "@/frontend/common/components/ui/state/ErrorState";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaListViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { buildQuotaListMetrics } from "@/frontend/common/views/dashboard/billing/quota/utils";
import { buildQuotaColumns } from "@/frontend/common/views/dashboard/billing/quota/utils/buildQuotaColumns";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { QuotaListDesktopActions } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopActions";
import { QuotaListDesktopFilterControls } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopFilterControls";
import { QuotaListDesktopGrid } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopGrid";
import { QuotaListDesktopRowActions } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopRowActions";

export function QuotaListDesktop(props: Readonly<QuotaListViewModel>) {
  const {
    t,
    quotas,
    totalCount,
    loading,
    page,
    pageSize,
    setPage,
    setPageSize,
    filterStatus,
    filterKind,
    searchQuery,
    setFilterStatus,
    setFilterKind,
    setSearchQuery,
    handleDelete,
  } = props;

  const columns = useMemo<GridColDef<QuotaItem>[]>(() => {
    const baseCols = buildQuotaColumns(t);
    baseCols.push({
      field: "actions",
      headerName: "",
      width: 130,
      sortable: false,
      renderCell: params => <QuotaListDesktopRowActions t={t} quotaId={params.row.id ?? ""} onDelete={handleDelete} />,
    });
    return baseCols;
  }, [t, handleDelete]);

  const metrics = useMemo(() => buildQuotaListMetrics(t, totalCount, quotas), [t, totalCount, quotas]);

  const hasError =
    !loading &&
    quotas.length === 0 &&
    totalCount === 0 &&
    (searchQuery.trim() !== "" || filterStatus !== null || filterKind !== null);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <DesktopMetricCardGrid metrics={metrics} size={{ md: 4, lg: 4 }} />

      <DesktopSectionPanel
        contentPadding={false}
        title={t.listTitle}
        actions={
          <Stack
            direction="row"
            spacing={2}
            sx={{ flex: 1, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}
          >
            <QuotaListDesktopFilterControls
              t={t}
              searchQuery={searchQuery}
              filterStatus={filterStatus}
              filterKind={filterKind}
              setSearchQuery={setSearchQuery}
              setFilterStatus={setFilterStatus}
              setFilterKind={setFilterKind}
            />
            <QuotaListDesktopActions t={t} />
          </Stack>
        }
      >
        {hasError ? (
          <ErrorState message={t.emptyListMessage} embedded />
        ) : (
          <QuotaListDesktopGrid
            quotas={quotas}
            columns={columns}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            setPage={setPage}
            setPageSize={setPageSize}
            t={t}
          />
        )}
      </DesktopSectionPanel>
    </Box>
  );
}

"use client";

import { AccountBalanceWalletOutlined } from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ErrorState } from "@/frontend/common/components/ui/state";
import { SCROLLBAR_CUE_SX } from "@/frontend/common/views/dashboard/accounting/__shared__";
import { CarryoverBulkCreateDialog } from "@/frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog";
import { SessionAuditAggregateCard } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditAggregateCard";
import {
  CELL_PAD_SX,
  EMPTY_REPORT_SX,
  HEADER_WRAP_SX,
  MOBILE_EDGE_FADE_SX,
  SESSION_AUDIT_PAGE_SIZE_OPTIONS,
  SESSION_AUDIT_SORTING_ORDER,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.constants";
import type { SessionAuditGridModel } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.selection";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

interface SessionAuditGridLayoutProps {
  readonly model: SessionAuditGridModel;
}

/** Carryover toolbar, the server-paginated audit grid, the aggregate footer and the bulk-create dialog. */
export function SessionAuditGridLayout({ model }: Readonly<SessionAuditGridLayoutProps>) {
  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      {model.canManageCarryover ? (
        <Stack direction="row" sx={{ gap: 1, justifyContent: "flex-end" }}>
          <Button
            id="session-audit-bulk-carryover"
            size="small"
            variant="outlined"
            startIcon={<AccountBalanceWalletOutlined />}
            disabled={model.selectedRows.length === 0}
            onClick={model.onOpenCarryoverDialog}
          >
            {model.labels.carryover.bulkAction}
          </Button>
        </Stack>
      ) : null}
      {model.error !== null ? (
        <ErrorState onRetry={model.refetch} />
      ) : (
        <Box sx={{ position: "relative" }}>
          <AppDataGrid<SessionAuditReportRow>
            rows={model.rows}
            columns={model.columns}
            loading={model.isLoading}
            getRowId={row => row.instanceId ?? row.id ?? ""}
            ariaLabel={model.labels.title}
            slots={{ noRowsOverlay: model.noRowsOverlay }}
            disableColumnMenu
            sortingMode="server"
            sortingOrder={SESSION_AUDIT_SORTING_ORDER}
            sx={
              model.rows.length === 0
                ? [HEADER_WRAP_SX, CELL_PAD_SX, SCROLLBAR_CUE_SX, EMPTY_REPORT_SX]
                : [HEADER_WRAP_SX, CELL_PAD_SX, SCROLLBAR_CUE_SX]
            }
            sortModel={model.sortModel}
            onSortModelChange={model.onSortModelChange}
            onCellClick={model.onCellClick}
            onCellKeyDown={model.onCellKeyDown}
            disableRowSelectionOnClick
            checkboxSelection={model.canManageCarryover}
            rowSelectionModel={model.selection.rowSelectionModel}
            onRowSelectionModelChange={model.selection.onSelectionChange}
            paginationOptions={buildServerPaginationOptions({
              page: model.page,
              pageSize: model.pageSize,
              totalCount: model.totalCount,
              onPageChange: model.canManageCarryover ? model.selection.onPageChange : model.setPage,
              onPageSizeChange: model.canManageCarryover ? model.selection.onPageSizeChange : model.setPageSize,
              pageSizeOptions: SESSION_AUDIT_PAGE_SIZE_OPTIONS,
            })}
          />
          <Box aria-hidden sx={MOBILE_EDGE_FADE_SX} />
        </Box>
      )}
      <SessionAuditAggregateCard
        totalPaidAmount={model.aggregates.totalPaidAmount}
        totalPaidCurrency={model.aggregates.totalPaidCurrency}
        rowCountByStatus={model.aggregates.rowCountByStatus}
        rowCountByPaid={model.aggregates.rowCountByPaid}
        labels={model.labels.aggregate}
        statusLabels={model.labels.status}
      />
      <CarryoverBulkCreateDialog
        open={model.carryoverDialogOpen}
        rows={model.selectedRows}
        labels={model.labels.carryover}
        onClose={model.onCloseCarryoverDialog}
        onDone={model.clearSelection}
      />
    </Stack>
  );
}

"use client";

import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  BaseParentInvoicesListProps,
  ParentInvoicesDataGridDesktopLabels,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildParentInvoiceColumns } from "@/frontend/desktop/views/dashboard/billing/components/parentInvoicesDataGrid.columns";

// The desktop tier carries grid-shaped labels (column headers + statusLabels +
// empty-title/subtitle); the mobile card list uses a different labels shape.
interface ParentInvoicesDataGridDesktopProps extends BaseParentInvoicesListProps {
  readonly labels: ParentInvoicesDataGridDesktopLabels;
}

export function ParentInvoicesDataGridDesktop({
  rows,
  labels,
  canView,
  canSubmitProof,
  canManage = false,
  billingActionsDisabled = false,
  onPayNow,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDownloadPdf,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ParentInvoicesDataGridDesktopProps>) {
  const emptyMessage =
    labels.emptyTitle && labels.emptySubtitle ? `${labels.emptyTitle} ${labels.emptySubtitle}` : labels.noEntries;

  // Memoize the columns array so the DataGrid keeps stable column identity
  // across prop-driven row updates; MUI X DataGrid re-runs row-height calc and
  // virtualization when the columns reference changes, so an inline array would
  // force re-layout on every parent re-render.
  const columns = useMemo(
    () =>
      buildParentInvoiceColumns({
        labels,
        canView,
        canSubmitProof,
        canManage,
        billingActionsDisabled,
        onPayNow,
        onMarkAsPaid,
        onViewPaymentDetails,
        onDownloadPdf,
      }),
    [
      billingActionsDisabled,
      canManage,
      canSubmitProof,
      canView,
      labels,
      onDownloadPdf,
      onMarkAsPaid,
      onPayNow,
      onViewPaymentDetails,
    ]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
    />
  );
}

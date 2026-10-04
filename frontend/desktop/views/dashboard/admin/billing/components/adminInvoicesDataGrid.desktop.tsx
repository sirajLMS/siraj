"use client";

import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  AdminInvoiceRow,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildAdminInvoicesColumns } from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop.columns";
import type {
  AdminInvoicesDataGridLabels,
  RenderInvoiceActionConfig,
} from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop.types";

interface AdminInvoicesDataGridProps {
  readonly rows: readonly AdminInvoiceRow[];
  readonly labels: AdminInvoicesDataGridLabels;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDeleteInvoice?: (invoiceId: string) => void;
  readonly canDelete?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

export function AdminInvoicesDataGridDesktop({
  rows,
  labels,
  canManage,
  canDelete = false,
  billingActionsDisabled = false,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDeleteInvoice,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<AdminInvoicesDataGridProps>) {
  const config = useMemo<Omit<RenderInvoiceActionConfig, "row">>(
    () => ({
      labels,
      canManage,
      canDelete,
      billingActionsDisabled,
    }),
    [canManage, canDelete, billingActionsDisabled, labels]
  );

  const columns = useMemo(
    () => buildAdminInvoicesColumns(labels, config, { onMarkAsPaid, onViewPaymentDetails, onDeleteInvoice }),
    [labels, config, onMarkAsPaid, onViewPaymentDetails, onDeleteInvoice]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      loading={loading}
      emptyMessage={labels.noEntries}
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

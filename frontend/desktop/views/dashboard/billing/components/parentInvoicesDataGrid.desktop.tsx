"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ParentInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type {
  BaseParentInvoicesListProps,
  ParentInvoicesDataGridDesktopLabels,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { DesktopAppDataGrid, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { ParentInvoiceRowActionsDesktop } from "@/frontend/desktop/views/dashboard/billing/components/parentInvoiceRowActions.desktop";

// VARIANT JUSTIFICATION: extra field labels — data-grid tier carries grid-shaped labels (column headers + statusLabels + empty-title/subtitle); mobile card list uses a different labels shape
interface ParentInvoicesDataGridDesktopProps extends BaseParentInvoicesListProps {
  readonly labels: ParentInvoicesDataGridDesktopLabels;
}

const StyledFeeTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

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

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoize the columns array so the DataGrid keeps stable column identity across prop-driven row updates; MUI X DataGrid re-runs row-height calc and virtualization when columns reference changes, so an inline array would force re-layout on every parent re-render
  const columns = useMemo<GridColDef<ParentInvoiceRow>[]>(
    () => [
      {
        field: "invoiceNumber",
        headerName: labels.invoiceNumber,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
            {row.invoiceNumber}
          </Typography>
        ),
      },
      {
        field: "month",
        headerName: labels.month,
        flex: 0.8,
        minWidth: 110,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.month}</Typography>,
      },
      {
        field: "issueDate",
        headerName: labels.issueDate,
        flex: 0.9,
        minWidth: 120,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.issueDate}</Typography>,
      },
      {
        field: "dueDate",
        headerName: labels.dueDate,
        flex: 0.9,
        minWidth: 120,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.dueDate}</Typography>,
      },
      {
        field: "paidDate",
        headerName: labels.paidDate,
        flex: 0.9,
        minWidth: 120,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="bodyMd">{row.paidDate}</Typography>
            {row.status === InvoiceStatus.Paid && row.hasPaymentProof ? (
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {labels.hasPaymentProofHint}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      {
        field: "fee",
        headerName: labels.fee,
        flex: 0.7,
        minWidth: 100,
        renderCell: ({ row }) => <StyledFeeTypography variant="bodyMd">{row.fee}</StyledFeeTypography>,
      },
      {
        field: "status",
        headerName: labels.status,
        flex: 0.8,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <DesktopStatusBadge
            category="invoice"
            status={row.status}
            label={labels.statusLabels[row.status] ?? row.status}
          />
        ),
      },
      {
        field: "options",
        headerName: labels.options,
        flex: 1.2,
        minWidth: 180,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => (
          <ParentInvoiceRowActionsDesktop
            row={row}
            labels={labels}
            canView={canView}
            canSubmitProof={canSubmitProof}
            canManage={canManage}
            billingActionsDisabled={billingActionsDisabled}
            onPayNow={onPayNow}
            onMarkAsPaid={onMarkAsPaid}
            onViewPaymentDetails={onViewPaymentDetails}
            onDownloadPdf={onDownloadPdf}
          />
        ),
      },
    ],
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

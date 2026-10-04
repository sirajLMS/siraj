"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ParentInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type {
  ParentInvoiceRowActionsProps,
  ParentInvoicesDataGridDesktopLabels,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { ParentInvoiceRowActionsDesktop } from "@/frontend/desktop/views/dashboard/billing/components/parentInvoiceRowActions.desktop";
import {
  InvoiceFeeCell,
  InvoicePaidDateCell,
  InvoiceStatusCell,
} from "@/frontend/desktop/views/dashboard/billing/components/parentInvoicesDataGrid.parts";

type ParentInvoiceColumnsParams = Readonly<
  Omit<ParentInvoiceRowActionsProps, "row" | "labels"> & { readonly labels: ParentInvoicesDataGridDesktopLabels }
>;

export function buildParentInvoiceColumns(params: ParentInvoiceColumnsParams): GridColDef<ParentInvoiceRow>[] {
  const {
    labels,
    canView,
    canSubmitProof,
    canManage,
    billingActionsDisabled,
    onPayNow,
    onMarkAsPaid,
    onViewPaymentDetails,
    onDownloadPdf,
  } = params;

  return [
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
      renderCell: ({ row }) => <InvoicePaidDateCell row={row} labels={labels} />,
    },
    {
      field: "fee",
      headerName: labels.fee,
      flex: 0.7,
      minWidth: 100,
      renderCell: ({ row }) => <InvoiceFeeCell row={row} />,
    },
    {
      field: "status",
      headerName: labels.status,
      flex: 0.8,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => <InvoiceStatusCell row={row} labels={labels} />,
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
  ];
}

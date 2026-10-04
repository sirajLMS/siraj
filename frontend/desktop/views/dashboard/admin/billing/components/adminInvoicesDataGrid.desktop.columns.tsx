import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type { AdminInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { formatInvoiceDisplayId } from "@/frontend/common/views/dashboard/billing/utils/formatInvoiceDisplayId";
import { DesktopPersonProfileLinkCell, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { RenderInvoiceAction } from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop.actions";
import type {
  AdminInvoiceActionHandlers,
  AdminInvoicesDataGridLabels,
  RenderInvoiceActionConfig,
} from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop.types";

const StyledInvoiceIdTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledDateTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

/** Column definitions for the desktop admin invoices DataGrid. */
export function buildAdminInvoicesColumns(
  labels: AdminInvoicesDataGridLabels,
  config: Omit<RenderInvoiceActionConfig, "row">,
  handlers: AdminInvoiceActionHandlers
): GridColDef<AdminInvoiceRow>[] {
  const { onMarkAsPaid, onViewPaymentDetails, onDeleteInvoice } = handlers;

  return [
    {
      field: "id",
      headerName: labels.invoiceId,
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => (
        <StyledInvoiceIdTypography variant="bodyMd" title={row.id}>
          {formatInvoiceDisplayId(row.id)}
        </StyledInvoiceIdTypography>
      ),
    },
    {
      field: "studentName",
      headerName: labels.studentName,
      flex: 1.2,
      minWidth: 200,
      renderCell: ({ row }) => (
        <DesktopPersonProfileLinkCell
          name={row.studentName}
          href={row.studentId ? studentHref(row.studentId) : undefined}
          fallbackInitial={row.studentInitials}
          avatarSize={32}
        />
      ),
    },
    {
      field: "dateIssued",
      headerName: labels.dateIssued,
      flex: 0.9,
      minWidth: 130,
      renderCell: ({ row }) => <StyledDateTypography variant="bodyMd">{row.dateIssued}</StyledDateTypography>,
    },
    {
      field: "amount",
      headerName: labels.amount,
      flex: 0.7,
      minWidth: 100,
      renderCell: ({ row }) => (
        <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
          {row.amount}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: labels.status,
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => (
        <DesktopStatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
      ),
    },
    {
      field: "actions",
      headerName: labels.actions,
      flex: 0.9,
      minWidth: 140,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) =>
        RenderInvoiceAction({ ...config, row }, onMarkAsPaid, onViewPaymentDetails, onDeleteInvoice),
    },
  ];
}

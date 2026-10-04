import { OpenInNewOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { ActionIconLink } from "@/frontend/common/components/ui";
import { BaseAvatar } from "@/frontend/common/components/ui/avatar";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
  numericCell,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { PaymentsCellLine } from "@/frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.parts";
import type { AppLocale } from "@/shared/locale/AppLocale";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/** Identity and money columns: student, credit hours, paid amount and package. */
function buildPaymentsIdentityColumns(t: PaymentsLabels): GridColDef[] {
  return [
    {
      field: "studentName",
      headerName: t.columns.studentName,
      flex: 1.2,
      minWidth: 190,
      renderCell: params => (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0, width: "100%" }}>
          <BaseAvatar label={params.row.studentName ?? undefined} size={30} />
          <Box sx={{ minWidth: 0 }}>
            <PaymentsCellLine>{params.row.studentName ?? "—"}</PaymentsCellLine>
            {params.row.parentName ? <PaymentsCellLine secondary>{params.row.parentName}</PaymentsCellLine> : null}
          </Box>
        </Stack>
      ),
    },
    {
      field: "creditHours",
      headerName: t.columns.credit,
      width: 105,
      type: "number",
      valueFormatter: (value: unknown) => (value == null ? "—" : `${numericCell(value).toFixed(2)} h`),
    },
    {
      field: "amount",
      headerName: t.columns.paid,
      flex: 1,
      minWidth: 130,
      align: "right",
      headerAlign: "right",
      renderCell: params => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {formatAccountingMoney(params.row.amount)}
          </Box>
          <Box
            component="span"
            sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: theme.typography.caption.fontSize })}
          >
            {params.row.currency ?? ""}
          </Box>
        </Stack>
      ),
    },
    {
      field: "packageName",
      headerName: t.columns.package,
      flex: 1,
      minWidth: 150,
      renderCell: params =>
        params.row.packageName ? (
          <Box sx={{ minWidth: 0, width: "100%" }}>
            <PaymentsCellLine>{params.row.packageName}</PaymentsCellLine>
            {params.row.packageCodename ? (
              <PaymentsCellLine secondary mono>
                {params.row.packageCodename}
              </PaymentsCellLine>
            ) : null}
          </Box>
        ) : (
          "—"
        ),
    },
  ];
}

/** Metadata columns: gateway, dates, paid status and the row action. */
function buildPaymentsMetaColumns(t: PaymentsLabels, locale: AppLocale): GridColDef[] {
  return [
    {
      field: "paymentGateway",
      headerName: t.columns.paymentGateway,
      width: 150,
      valueGetter: (value: unknown) => {
        const labels: Record<string, string | undefined> = t.gateways;
        return typeof value === "string" ? (labels[value] ?? textCell(value)) : textCell(value);
      },
    },
    {
      field: "paymentDate",
      headerName: t.columns.paymentDate,
      width: 120,
      valueFormatter: (value: unknown) => formatAccountingDate(dateCell(value), locale),
    },
    {
      field: "createdAt",
      headerName: t.columns.createdAt,
      width: 120,
      valueFormatter: (value: unknown) => formatAccountingDate(dateCell(value), locale),
    },
    {
      field: "isPaidStatusOn",
      headerName: t.columns.status,
      width: 118,
      renderCell: params => (
        <DesktopStatusBadge
          category="session"
          status={params.row.isPaidStatusOn ? "active" : "pending"}
          label={params.row.isPaidStatusOn ? t.status.paid : t.status.unpaid}
        />
      ),
    },
    {
      field: "actions",
      headerName: t.columns.actions,
      width: 120,
      sortable: false,
      renderCell: params => (
        // VIEW-safe: this opens the (role-scoped) detail page — it must NOT
        // read as a manage ("Edit") action for VIEW-only roles like staff.
        <Tooltip title={t.paymentDetails}>
          <ActionIconLink href={`/accounting/payments/${params.row.id}`} aria-label={t.paymentDetails}>
            <OpenInNewOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ),
    },
  ];
}

/** Column definitions for the desktop accounting payments DataGrid. */
export function buildPaymentsListColumns(t: PaymentsLabels, locale: AppLocale): GridColDef[] {
  return [...buildPaymentsIdentityColumns(t), ...buildPaymentsMetaColumns(t, locale)];
}

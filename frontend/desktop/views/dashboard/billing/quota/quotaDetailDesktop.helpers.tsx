import { type Theme, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { formatQuotaDate } from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

function getDeltaColor(value: number, theme: Theme) {
  if (value > 0) return { color: theme.palette.success.main };
  if (value < 0) return { color: theme.palette.error.main };
  return { color: theme.palette.text.primary };
}

export function buildDesktopBreadcrumbs(t: QuotaLabels) {
  return [
    { label: t.listTitle, href: "/quotas" },
    { label: t.quotaDetails, current: true },
  ];
}

export function buildLedgerColumns(t: QuotaLabels): GridColDef<QuotaLedgerItem>[] {
  return [
    {
      field: "reason",
      headerName: t.ledger.reason,
      flex: 1,
      minWidth: 140,
    },
    {
      field: "delta",
      headerName: t.ledger.delta,
      type: "number",
      flex: 0.8,
      minWidth: 100,
      renderCell: params => (
        <Typography variant="body2" sx={(theme: Theme) => ({ fontWeight: 700, ...getDeltaColor(params.value, theme) })}>
          {params.value > 0 ? `+${params.value}` : params.value}
        </Typography>
      ),
    },
    {
      field: "reasonNote",
      headerName: t.ledger.note,
      flex: 1.5,
      minWidth: 180,
      renderCell: params => params.value ?? "—",
    },
    {
      field: "createdAt",
      headerName: t.ledger.date,
      flex: 1,
      minWidth: 150,
      renderCell: params => formatQuotaDate(params.value),
    },
  ];
}

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { StatusBadge } from "@/frontend/common/components/ui/badge";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  formatQuotaDate,
  formatQuotaKind,
  formatQuotaStatus,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export function buildQuotaColumns(t: QuotaLabels): GridColDef<QuotaItem>[] {
  return [
    {
      field: "name",
      headerName: t.fields.name,
      flex: 1.5,
      minWidth: 160,
      renderCell: params => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "kind",
      headerName: t.fields.kind,
      flex: 1,
      minWidth: 120,
      renderCell: params => {
        const label = formatQuotaKind(params.value ?? "", t);
        return (
          <StatusBadge
            category="quotaStatus"
            status={params.value ?? ""}
            label={label}
            size="small"
            component="output"
          />
        );
      },
    },
    {
      field: "status",
      headerName: t.fields.status,
      flex: 1,
      minWidth: 120,
      renderCell: params => {
        const { label } = formatQuotaStatus(params.value ?? "", t);
        return (
          <StatusBadge
            category="quotaStatus"
            status={params.value ?? ""}
            label={label}
            size="small"
            component="output"
          />
        );
      },
    },
    {
      field: "totalClasses",
      headerName: t.fields.totalClasses,
      type: "number",
      flex: 0.8,
      minWidth: 100,
    },
    {
      field: "remaining",
      headerName: t.fields.remaining,
      type: "number",
      flex: 0.8,
      minWidth: 100,
      renderCell: params => <Box sx={{ fontWeight: 700 }}>{params.value}</Box>,
    },
    {
      field: "reservedClasses",
      headerName: t.fields.reservedClasses,
      type: "number",
      flex: 0.8,
      minWidth: 100,
    },
    {
      field: "validUntil",
      headerName: t.fields.validUntil,
      flex: 1,
      minWidth: 130,
      renderCell: params => formatQuotaDate(params.value),
    },
  ];
}

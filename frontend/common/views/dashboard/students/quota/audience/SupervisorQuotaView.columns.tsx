import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { ActionIconLink, StatusBadge } from "@/frontend/common/components/ui";
import type { QuotasQuery_quotas_rows } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatDate } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceLedger.utils";
import {
  getQuotaKindLabel,
  getQuotaStatusLabel,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export type SupervisorQuotaRow = QuotasQuery_quotas_rows;

function buildQuotaBaseColumns(t: StudentQuotaLabels): GridColDef<SupervisorQuotaRow>[] {
  return [
    {
      field: "name",
      headerName: t.audience.name,
      flex: 1.5,
      minWidth: 160,
      renderCell: params => (
        <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
          {params.value ?? t.common.notSet}
        </Typography>
      ),
    },
    {
      field: "kind",
      headerName: t.audience.kind,
      flex: 1,
      minWidth: 120,
      renderCell: params => (
        <StatusBadge
          category="quotaStatus"
          status={params.value ?? ""}
          label={getQuotaKindLabel(params.value, t)}
          size="small"
          component="output"
        />
      ),
    },
    {
      field: "status",
      headerName: t.audience.status,
      flex: 1,
      minWidth: 120,
      renderCell: params => (
        <StatusBadge
          category="quotaStatus"
          status={params.value ?? ""}
          label={getQuotaStatusLabel(params.value, t)}
          size="small"
          component="output"
        />
      ),
    },
    {
      field: "totalClasses",
      headerName: t.audience.totalClasses,
      type: "number",
      flex: 0.8,
      minWidth: 100,
    },
    {
      field: "remaining",
      headerName: t.audience.remaining,
      type: "number",
      flex: 0.8,
      minWidth: 100,
      renderCell: params => (
        <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
          {params.value ?? 0}
        </Typography>
      ),
    },
    {
      field: "validFrom",
      headerName: t.audience.validFrom,
      flex: 1,
      minWidth: 130,
      renderCell: params => formatDate(params.value),
    },
    {
      field: "validUntil",
      headerName: t.audience.validUntil,
      flex: 1,
      minWidth: 130,
      renderCell: params => formatDate(params.value),
    },
    {
      field: "createdAt",
      headerName: t.audience.createdAt,
      flex: 1,
      minWidth: 130,
      renderCell: params => formatDate(params.value),
    },
  ];
}

function buildQuotaActionsColumn(t: StudentQuotaLabels): GridColDef<SupervisorQuotaRow> {
  return {
    field: "actions",
    headerName: t.audience.editQuota,
    flex: 0.6,
    minWidth: 100,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 0.5 }}>
        <Tooltip title={t.audience.editQuota}>
          <ActionIconLink href={`/quotas/${params.row.id ?? ""}/edit`} aria-label={t.audience.editQuota}>
            <EditOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
        <Tooltip title={t.audience.deleteQuota}>
          <ActionIconLink href={`/quotas/${params.row.id ?? ""}/delete`} aria-label={t.audience.deleteQuota}>
            <DeleteOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      </Box>
    ),
  };
}

export function buildSupervisorQuotaColumns(
  t: StudentQuotaLabels,
  canManage: boolean
): GridColDef<SupervisorQuotaRow>[] {
  const columns = buildQuotaBaseColumns(t);
  if (!canManage) {
    return columns;
  }
  return [...columns, buildQuotaActionsColumn(t)];
}

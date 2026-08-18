"use client";

import { useQuery } from "@apollo/client/react";
import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import type { ReactElement } from "react";
import { PrimaryPageAction, SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotasQuery_quotas_QuotaPaginatedResult_rows_Quota } from "@/frontend/common/graphql/generated/gql/operations";
import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import {
  getQuotaKindLabel,
  getQuotaStatusLabel,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface SupervisorQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

type QuotaRow = QuotasQuery_quotas_QuotaPaginatedResult_rows_Quota;

function formatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr.length === 0) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function buildQuotaColumns(t: StudentQuotaLabels, canManage: boolean): GridColDef<QuotaRow>[] {
  const baseColumns: GridColDef<QuotaRow>[] = [
    {
      field: "name",
      headerName: t.audience.name,
      flex: 1.5,
      minWidth: 160,
      renderCell: params => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
      renderCell: params => <Box sx={{ fontWeight: 700 }}>{params.value ?? 0}</Box>,
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

  if (!canManage) {
    return baseColumns;
  }

  const actionsColumn: GridColDef<QuotaRow> = {
    field: "actions",
    headerName: t.audience.editQuota,
    flex: 0.6,
    minWidth: 100,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <Stack sx={{ flexDirection: "row", gap: 0.5, alignItems: "center" }}>
        <Link href={`/quotas/${params.row.id ?? ""}/edit`} style={{ textDecoration: "none" }}>
          <Button size="small" startIcon={<EditOutlined />} sx={{ minWidth: "auto", textTransform: "none" }}>
            {t.audience.editQuota}
          </Button>
        </Link>
        <Link href={`/quotas/${params.row.id ?? ""}/delete`} style={{ textDecoration: "none" }}>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlined />}
            sx={{ minWidth: "auto", textTransform: "none" }}
          >
            {t.audience.deleteQuota}
          </Button>
        </Link>
      </Stack>
    ),
  };

  return [...baseColumns, actionsColumn];
}

export function SupervisorQuotaView({ t }: Readonly<SupervisorQuotaViewProps>): ReactElement {
  const hasPermission = useUserStore(s => s.hasPermission);
  const canManage = hasPermission(AppPermission.QuotasManage);

  const { data, loading } = useQuery(quotasQueryDocument, {
    variables: {
      filter: null,
      pagination: { after: null, before: null, first: 50, last: null, maxCount: null, page: null, skip: 0 },
    },
  });

  const quotas: QuotaRow[] = data?.quotas?.rows ?? [];
  const totalCount = data?.quotas?.totalCount ?? 0;

  if (loading) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (quotas.length === 0) {
    logger.info("SupervisorQuotaView: No quotas found");
    return <QuotaEmptyState message={t.audience.noData} />;
  }

  const columns = buildQuotaColumns(t, canManage);
  const activeCount = quotas.filter(q => String(q.status) === "ACTIVE").length;
  const expiredCount = quotas.filter(q => String(q.status) === "EXPIRED").length;
  const archivedCount = quotas.filter(q => String(q.status) === "ARCHIVED").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SectionPanel
        title={t.audience.supervisorTitle}
        actions={
          canManage ? (
            <Link href="/quotas/new" style={{ textDecoration: "none" }}>
              <PrimaryPageAction color="primary" startIcon={<AddOutlined />}>
                {t.audience.newQuota}
              </PrimaryPageAction>
            </Link>
          ) : null
        }
      >
        <Stack sx={{ flexDirection: "row", gap: 2, flexWrap: "wrap" }}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 120 }}>
            <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.audience.totalClasses}
            </Typography>
            <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
              {totalCount}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 120 }}>
            <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.audience.statuses.ACTIVE}
            </Typography>
            <Typography variant="headlineMd" sx={theme => ({ fontWeight: 700, color: theme.palette.success.main })}>
              {activeCount}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 120 }}>
            <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.audience.statuses.EXPIRED}
            </Typography>
            <Typography variant="headlineMd" sx={theme => ({ fontWeight: 700, color: theme.palette.error.main })}>
              {expiredCount}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 120 }}>
            <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.audience.statuses.ARCHIVED}
            </Typography>
            <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
              {archivedCount}
            </Typography>
          </Paper>
        </Stack>
        <AppDataGrid
          rows={quotas}
          columns={columns}
          loading={loading}
          emptyMessage={t.audience.noData}
          ariaLabel={t.audience.supervisorTitle}
          paginationOptions={{ mode: "client", pageSize: 10 }}
        />
      </SectionPanel>
    </Box>
  );
}

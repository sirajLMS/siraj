"use client";

import { useQuery } from "@apollo/client/react";
import {
  AddOutlined,
  ArchiveOutlined,
  CheckCircleOutlined,
  ClassOutlined,
  DeleteOutlined,
  EditOutlined,
  EventBusyOutlined,
  type SvgIconComponent,
} from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { ActionIconLink, PrimaryPageAction, SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { AppPermission, type QuotasQuery_quotas_rows } from "@/frontend/common/graphql/generated/gql/graphql";
import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";
import {
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import {
  getQuotaKindLabel,
  getQuotaStatusLabel,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import { SupervisorQuotaMetrics } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/supervisorQuotaMetrics";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

type SupervisorQuotaMetricsRenderer = (params: { readonly metrics: readonly MetricItem[] }) => ReactNode;

interface SupervisorQuotaViewProps {
  readonly t: StudentQuotaLabels;
  /** Tier metrics grid (Desktop/MobileMetricCardGrid) injected by tier composition. */
  readonly renderMetricsGrid?: SupervisorQuotaMetricsRenderer;
}

type QuotaRow = QuotasQuery_quotas_rows;

const SUPERVISOR_QUOTA_METRIC_ICONS: Record<string, SvgIconComponent> = {
  totalClasses: ClassOutlined,
  active: CheckCircleOutlined,
  expired: EventBusyOutlined,
  archived: ArchiveOutlined,
};

function buildSupervisorQuotaMetrics(params: {
  readonly t: StudentQuotaLabels;
  readonly totalCount: number;
  readonly activeCount: number;
  readonly expiredCount: number;
  readonly archivedCount: number;
}): MetricItem[] {
  const { t, totalCount, activeCount, expiredCount, archivedCount } = params;
  const counts: Record<string, number> = {
    totalClasses: totalCount,
    active: activeCount,
    expired: expiredCount,
    archived: archivedCount,
  };
  const labels: Record<string, string> = {
    totalClasses: t.audience.totalClasses,
    active: t.audience.statuses.ACTIVE,
    expired: t.audience.statuses.EXPIRED,
    archived: t.audience.statuses.ARCHIVED,
  };

  return Object.keys(labels).map(key => ({
    key,
    count: counts[key] ?? 0,
    labelKey: key,
    label: labels[key],
    icon: SUPERVISOR_QUOTA_METRIC_ICONS[key] ?? ClassOutlined,
    variant: key === "expired" ? "error" : "default",
  }));
}

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

  return [...baseColumns, actionsColumn];
}

export function SupervisorQuotaView({ t, renderMetricsGrid }: Readonly<SupervisorQuotaViewProps>): ReactElement {
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
  const metrics = buildSupervisorQuotaMetrics({
    t,
    totalCount,
    activeCount: quotas.filter(q => String(q.status) === "ACTIVE").length,
    expiredCount: quotas.filter(q => String(q.status) === "EXPIRED").length,
    archivedCount: quotas.filter(q => String(q.status) === "ARCHIVED").length,
  });

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
        {renderMetricsGrid ? renderMetricsGrid({ metrics }) : <SupervisorQuotaMetrics metrics={metrics} />}
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

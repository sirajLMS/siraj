"use client";

import { useQuery } from "@apollo/client/react";
import { AddOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";
import {
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import { SupervisorQuotaMetrics } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/supervisorQuotaMetrics";
import {
  buildSupervisorQuotaColumns,
  type SupervisorQuotaRow,
} from "@/frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.columns";
import { buildSupervisorQuotaMetrics } from "@/frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.metrics";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

type SupervisorQuotaMetricsRenderer = (params: { readonly metrics: readonly MetricItem[] }) => ReactNode;

interface SupervisorQuotaViewProps {
  readonly t: StudentQuotaLabels;
  /** Tier metrics grid (Desktop/MobileMetricCardGrid) injected by tier composition. */
  readonly renderMetricsGrid?: SupervisorQuotaMetricsRenderer;
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

  const quotas: SupervisorQuotaRow[] = data?.quotas?.rows ?? [];
  const totalCount = data?.quotas?.totalCount ?? 0;

  if (loading) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (quotas.length === 0) {
    logger.info("SupervisorQuotaView: No quotas found");
    return <QuotaEmptyState message={t.audience.noData} />;
  }

  const columns = buildSupervisorQuotaColumns(t, canManage);
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

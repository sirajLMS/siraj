"use client";

import { BarChartOutlined, ErrorOutlined, HourglassEmptyOutlined, WarningOutlined } from "@mui/icons-material";
import type { QuotaAudienceSection } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared";
import { QuotaAudienceViewShared } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface SupervisorQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

function buildSupervisorSections(t: StudentQuotaLabels): readonly QuotaAudienceSection[] {
  return [
    {
      label: t.audience.onDemandPendingQueue,
      emptyStateMessage: t.audience.noData,
      icon: HourglassEmptyOutlined,
      iconColor: "warning.main",
    },
    {
      label: t.audience.conflictHeld,
      emptyStateMessage: t.audience.noData,
      icon: WarningOutlined,
      iconColor: "error.main",
    },
    {
      label: t.audience.lowBalanceAlerts,
      emptyStateMessage: t.audience.noData,
      icon: ErrorOutlined,
      iconColor: "error.main",
    },
    {
      label: t.audience.analyticsOverview,
      emptyStateMessage: t.audience.noData,
      icon: BarChartOutlined,
      iconLayout: "inline",
    },
  ];
}

export function SupervisorQuotaView({ t }: Readonly<SupervisorQuotaViewProps>) {
  return <QuotaAudienceViewShared title={t.audience.supervisorTitle} sections={buildSupervisorSections(t)} />;
}

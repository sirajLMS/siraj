"use client";

import { Box } from "@mui/material";
import { SuspensionAnalyticsChartShared } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.chart.parts";
import { SuspensionAnalyticsCtaShared } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.ctaSection.parts";
import type { SuspensionAnalyticsTierConfig } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.types";
import type { SuspensionAnalyticsProps } from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.types";

export interface SuspensionAnalyticsScaffoldProps extends SuspensionAnalyticsProps {
  readonly tier: SuspensionAnalyticsTierConfig;
}

export function SuspensionAnalyticsScaffold({
  labels,
  suspendedCount,
  onOpenAuditLogs,
  tier,
}: Readonly<SuspensionAnalyticsScaffoldProps>) {
  return (
    <Box sx={tier.outerContainerSx}>
      <SuspensionAnalyticsChartShared labels={labels} tier={tier} />
      <SuspensionAnalyticsCtaShared
        labels={labels}
        suspendedCount={suspendedCount}
        onOpenAuditLogs={onOpenAuditLogs}
        tier={tier}
      />
    </Box>
  );
}

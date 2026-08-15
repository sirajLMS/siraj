"use client";

import { Box, Skeleton } from "@mui/material";
import type { ReactNode } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { MeetingIntegrationsHealthHeadersShared } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/__shared__/meetingIntegrationsHealthHeadersShared";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

const SKELETON_KEYS = ["totalProviders", "connected", "issues", "disconnected"];

function renderMobileSkeleton(): ReactNode {
  return (
    <Box sx={{ display: "flex", gap: 2, overflowX: "hidden" }}>
      {SKELETON_KEYS.map(key => (
        <Box key={`health-header-skeleton-${key}`} sx={{ flex: "0 0 148px", minWidth: 148 }}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
    </Box>
  );
}

export function MeetingIntegrationsHealthHeadersMobile(viewModel: Readonly<MeetingIntegrationsViewModel>): ReactNode {
  return (
    <MeetingIntegrationsHealthHeadersShared
      viewModel={viewModel}
      renderSkeleton={renderMobileSkeleton}
      renderMetrics={(metrics: readonly MetricItem[]) => <MobileMetricCardGrid metrics={metrics} />}
    />
  );
}

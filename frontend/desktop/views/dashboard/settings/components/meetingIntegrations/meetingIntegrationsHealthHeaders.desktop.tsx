"use client";

import { Grid, Skeleton } from "@mui/material";
import type { ReactNode } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { MeetingIntegrationsHealthHeadersShared } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/__shared__/meetingIntegrationsHealthHeadersShared";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

const SKELETON_KEYS = ["totalProviders", "connected", "issues", "disconnected"];

function renderDesktopSkeleton(): ReactNode {
  return (
    <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
      {SKELETON_KEYS.map(key => (
        <Grid key={`health-header-skeleton-${key}`} size={{ xs: 6, md: 3 }}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );
}

export function MeetingIntegrationsHealthHeadersDesktop(viewModel: Readonly<MeetingIntegrationsViewModel>): ReactNode {
  return (
    <MeetingIntegrationsHealthHeadersShared
      viewModel={viewModel}
      renderSkeleton={renderDesktopSkeleton}
      renderMetrics={(metrics: readonly MetricItem[]) => (
        <DesktopMetricCardGrid metrics={metrics} size={{ xs: 6, md: 3 }} density="default" />
      )}
    />
  );
}

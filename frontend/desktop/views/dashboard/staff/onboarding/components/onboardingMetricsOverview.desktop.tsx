"use client";

import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { OnboardingMetricsOverviewProps } from "@/frontend/common/views/dashboard/staff/onboarding/types";
import type { OnboardingMetricKey } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import { resolveMetricValue } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

const METRIC_ITEMS = [
  { key: "activeStaff", icon: GroupsOutlined },
  { key: "pendingApproval", icon: PendingActionsOutlined },
  { key: "avgOnboarding", icon: SpeedOutlined },
] as const satisfies ReadonlyArray<{ readonly key: OnboardingMetricKey; readonly icon: typeof GroupsOutlined }>;

export function OnboardingMetricsOverviewDesktop({ labels, model }: Readonly<OnboardingMetricsOverviewProps>) {
  const { metrics, loading } = model;

  const metricItems: MetricItem[] = METRIC_ITEMS.map(item => ({
    key: item.key,
    count: resolveMetricValue(metrics, item.key, loading),
    labelKey: item.key,
    label: labels[item.key],
    icon: item.icon,
  }));

  return (
    <Box sx={{ mt: 6 }}>
      <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 12, lg: 4 }} />
    </Box>
  );
}

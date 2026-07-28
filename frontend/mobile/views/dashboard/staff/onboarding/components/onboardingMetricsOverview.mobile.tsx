"use client";

import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { OnboardingMetricsOverviewProps } from "@/frontend/common/views/dashboard/staff/onboarding/types";
import type { OnboardingMetricKey } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import { resolveMetricValue } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

const METRIC_ITEMS = [
  { key: "activeStaff", icon: GroupsOutlined },
  { key: "pendingApproval", icon: PendingActionsOutlined },
  { key: "avgOnboarding", icon: SpeedOutlined },
] as const satisfies ReadonlyArray<{ readonly key: OnboardingMetricKey; readonly icon: typeof GroupsOutlined }>;

export function OnboardingMetricsOverviewMobile({ labels, model }: Readonly<OnboardingMetricsOverviewProps>) {
  const { metrics, loading } = model;

  const metricItems: readonly MetricItem[] = useMemo(
    () =>
      METRIC_ITEMS.map(item => ({
        key: item.key,
        label: labels[item.key],
        count: resolveMetricValue(metrics, item.key, loading),
        icon: item.icon,
        labelKey: item.key,
        variant: "default" as const,
      })),
    [labels, loading, metrics]
  );

  return <MobileMetricCardGrid metrics={metricItems} sx={{ mt: 4 }} />;
}

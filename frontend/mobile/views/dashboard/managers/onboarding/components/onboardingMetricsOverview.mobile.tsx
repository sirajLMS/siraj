"use client";

import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { OnboardingMetricsOverviewProps } from "@/frontend/common/views/dashboard/managers/onboarding/types";
import type { OnboardingMetricKey } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { resolveMetricValue } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

const METRIC_ITEMS = [
  { key: "activeStaff", icon: GroupsOutlined },
  { key: "pendingApproval", icon: PendingActionsOutlined },
  { key: "avgOnboarding", icon: SpeedOutlined },
] as const satisfies ReadonlyArray<{ readonly key: OnboardingMetricKey; readonly icon: typeof GroupsOutlined }>;

export function OnboardingMetricsOverviewMobile({ model }: Readonly<OnboardingMetricsOverviewProps>) {
  const t = useAppTranslation().dashboardTranslations.managerOnboarding.metrics;
  const { metrics, loading } = model;

  const metricItems: readonly MetricItem[] = useMemo(
    () =>
      METRIC_ITEMS.map(item => ({
        key: item.key,
        label: t[item.key],
        count: resolveMetricValue(metrics, item.key, loading),
        icon: item.icon,
        labelKey: item.key,
        variant: "default" as const,
      })),
    [loading, metrics, t]
  );

  return <MobileMetricCardGrid metrics={metricItems} sx={{ mt: 4 }} />;
}

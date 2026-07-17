"use client";

import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type {
  OnboardingMetricKey,
  OnboardingMetricsViewModel,
} from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { resolveMetricValue } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { useAppTranslation } from "@/shared/locale";

const METRIC_ITEMS = [
  { key: "activeStaff", icon: GroupsOutlined },
  { key: "pendingApproval", icon: PendingActionsOutlined },
  { key: "avgOnboarding", icon: SpeedOutlined },
] as const satisfies ReadonlyArray<{ readonly key: OnboardingMetricKey; readonly icon: typeof GroupsOutlined }>;

export interface OnboardingMetricsOverviewDesktopProps {
  readonly model: OnboardingMetricsViewModel;
}

export function OnboardingMetricsOverviewDesktop({ model }: Readonly<OnboardingMetricsOverviewDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.managerOnboarding.metrics;
  const { metrics, loading } = model;

  return (
    <Grid container spacing={3} sx={{ mt: 6 }}>
      {METRIC_ITEMS.map((item, index) => (
        <Grid key={item.key} size={{ xs: 12, lg: 4 }}>
          <MetricCard
            label={t[item.key]}
            value={resolveMetricValue(metrics, item.key, loading)}
            icon={item.icon}
            variant="default"
            animationIndex={index}
          />
        </Grid>
      ))}
    </Grid>
  );
}

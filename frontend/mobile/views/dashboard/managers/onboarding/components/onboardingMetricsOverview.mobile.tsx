"use client";

import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { OnboardingMetricsOverviewProps } from "@/frontend/common/views/dashboard/managers/onboarding/types";
import type { OnboardingMetricKey } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { resolveMetricValue } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { useAppTranslation } from "@/shared/locale";

const METRIC_ITEMS = [
  { key: "activeStaff", icon: GroupsOutlined },
  { key: "pendingApproval", icon: PendingActionsOutlined },
  { key: "avgOnboarding", icon: SpeedOutlined },
] as const satisfies ReadonlyArray<{ readonly key: OnboardingMetricKey; readonly icon: typeof GroupsOutlined }>;

export function OnboardingMetricsOverviewMobile({ model }: Readonly<OnboardingMetricsOverviewProps>) {
  const t = useAppTranslation().dashboardTranslations.managerOnboarding.metrics;
  const { metrics, loading } = model;

  return (
    <Box
      sx={theme => ({
        display: "flex",
        gap: theme.spacing(2),
        overflowX: "auto",
        paddingBottom: theme.spacing(1),
        marginLeft: -0.5,
        paddingLeft: 0.5,
        mt: 4,
        "::-webkit-scrollbar": { display: "none" },
      })}
    >
      {METRIC_ITEMS.map((item, index) => (
        <Box key={item.key} sx={{ flexShrink: 0, width: 192 }}>
          <MetricCard
            label={t[item.key]}
            value={resolveMetricValue(metrics, item.key, loading)}
            icon={item.icon}
            variant="default"
            animationIndex={index}
          />
        </Box>
      ))}
    </Box>
  );
}

"use client";

import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui/MetricCard";

const METRIC_ITEMS = [
  { key: "activeStaff", value: "128", icon: GroupsOutlined },
  { key: "pendingApproval", value: "12", icon: PendingActionsOutlined },
  { key: "avgOnboarding", value: "2.4 d", icon: SpeedOutlined },
] as const;

export function OnboardingMetricsOverview() {
  const t = useTranslations("dashboard.managerOnboarding.metrics");

  return (
    <Box sx={{ mt: 6 }}>
      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          gap: 2,
          overflowX: "auto",
          pb: 1,
          mx: -0.5,
          px: 0.5,
        }}
      >
        {METRIC_ITEMS.map(item => (
          <Box key={item.key} sx={{ flexShrink: 0, width: 192 }}>
            <MetricCard label={t(item.key)} value={item.value} icon={item.icon} variant="default" />
          </Box>
        ))}
      </Box>
      <Grid container spacing={3} sx={{ display: { xs: "none", lg: "flex" } }}>
        {METRIC_ITEMS.map(item => (
          <Grid key={item.key} size={{ xs: 12, lg: 4 }}>
            <MetricCard label={t(item.key)} value={item.value} icon={item.icon} variant="default" animated />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

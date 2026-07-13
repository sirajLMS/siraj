"use client";

import { useQuery } from "@apollo/client/react";
import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui/card/MetricCard";
import { onboardingMetricsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";

const METRIC_ITEMS = [
  { key: "activeStaff", icon: GroupsOutlined },
  { key: "pendingApproval", icon: PendingActionsOutlined },
  { key: "avgOnboarding", icon: SpeedOutlined },
] as const;

const StyledMetricsWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(6),
}));

const StyledMobileMetricsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  overflowX: "auto",
  paddingBottom: theme.spacing(1),
  marginLeft: -0.5,
  paddingLeft: 0.5,
  [theme.breakpoints.up("lg")]: {
    display: "none",
  },
}));

function getValue(
  metrics:
    | { activeStaff?: number | null; pendingApproval?: number | null; avgOnboardingDays?: number | null }
    | null
    | undefined,
  key: string,
  loading: boolean
): string | number {
  if (loading) return "...";
  if (!metrics) return 0;
  if (key === "activeStaff") return metrics.activeStaff ?? 0;
  if (key === "pendingApproval") return metrics.pendingApproval ?? 0;
  if (key === "avgOnboarding")
    return metrics.avgOnboardingDays == null ? "0 d" : `${metrics.avgOnboardingDays.toFixed(1)} d`;
  return 0;
}

export function OnboardingMetricsOverview() {
  const t = useTranslations("dashboard.managerOnboarding.metrics");
  const { data, loading } = useQuery(onboardingMetricsQueryDocument);
  const metrics = data?.onboardingMetrics;

  return (
    <StyledMetricsWrapper>
      <StyledMobileMetricsContainer>
        {METRIC_ITEMS.map((item, index) => (
          <Box key={item.key} sx={{ flexShrink: 0, width: 192 }}>
            <MetricCard
              label={t(item.key)}
              value={getValue(metrics, item.key, loading)}
              icon={item.icon}
              variant="default"
              animationIndex={index}
            />
          </Box>
        ))}
      </StyledMobileMetricsContainer>

      <Grid container spacing={3}>
        {METRIC_ITEMS.map((item, index) => (
          <Grid key={item.key} size={{ xs: 12, lg: 4 }}>
            <MetricCard
              label={t(item.key)}
              value={getValue(metrics, item.key, loading)}
              icon={item.icon}
              variant="default"
              animationIndex={index}
            />
          </Grid>
        ))}
      </Grid>
    </StyledMetricsWrapper>
  );
}

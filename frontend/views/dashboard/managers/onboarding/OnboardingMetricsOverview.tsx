"use client";

import { GroupsOutlined, PendingActionsOutlined, SpeedOutlined } from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui/MetricCard";

const METRIC_ITEMS = [
  { key: "activeStaff", value: "128", icon: GroupsOutlined },
  { key: "pendingApproval", value: "12", icon: PendingActionsOutlined },
  { key: "avgOnboarding", value: "2.4 d", icon: SpeedOutlined },
] as const;

/* ────────────────────────────────────────────────────────────────────────────
 * Styled Components — Extracted inline sx styles for reusability & consistency
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Outer wrapper with top spacing separating it from form content.
 */
const StyledMetricsWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(6),
}));

/**
 * Mobile-only horizontal scrollable container for metric cards.
 */
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

/* ────────────────────────────────────────────────────────────────────────────
 * OnboardingMetricsOverview Component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Overview of onboarding-related metrics displayed below the manager onboarding form.
 *
 * Shows three key metrics: active staff count, pending approvals, and average onboarding time.
 * Layout adapts to screen size: horizontal scroll on mobile, grid on desktop.
 *
 * @see METRIC_ITEMS constant above for available metrics
 */
export function OnboardingMetricsOverview() {
  const t = useTranslations("dashboard.managerOnboarding.metrics");

  return (
    <StyledMetricsWrapper>
      {/* Mobile view: horizontal scroll */}
      <StyledMobileMetricsContainer>
        {METRIC_ITEMS.map(item => (
          <Box key={item.key} sx={{ flexShrink: 0, width: 192 }}>
            <MetricCard label={t(item.key)} value={item.value} icon={item.icon} variant="default" />
          </Box>
        ))}
      </StyledMobileMetricsContainer>

      {/* Desktop view: grid layout */}
      <Grid container spacing={3}>
        {METRIC_ITEMS.map(item => (
          <Grid key={item.key} size={{ xs: 12, lg: 4 }}>
            <MetricCard label={t(item.key)} value={item.value} icon={item.icon} variant="default" animated />
          </Grid>
        ))}
      </Grid>
    </StyledMetricsWrapper>
  );
}

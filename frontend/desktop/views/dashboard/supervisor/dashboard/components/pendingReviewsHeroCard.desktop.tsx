"use client";

import { PendingActionsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import type { SupervisorDashboardLabels } from "@/shared/locale";

interface PendingReviewsHeroCardDesktopProps {
  readonly count: number;
  readonly labels: SupervisorDashboardLabels;
  readonly onGoToReviews: () => void;
}

export function PendingReviewsHeroCardDesktop({
  count,
  labels,
  onGoToReviews,
}: Readonly<PendingReviewsHeroCardDesktopProps>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerHigh,
        borderRadius: theme.layout.radius.section,
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Box
          sx={theme => ({
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          <PendingActionsOutlined fontSize="medium" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface, mb: 0.5 })}>
            {labels.pendingReviewsHero(count)}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.pendingReviewsSubtitle}
          </Typography>
        </Box>
      </Stack>
      {count > 0 ? (
        <PrimaryPageAction onClick={onGoToReviews} sx={{ alignSelf: "flex-start" }}>
          {labels.goToReviews}
        </PrimaryPageAction>
      ) : null}
    </Box>
  );
}

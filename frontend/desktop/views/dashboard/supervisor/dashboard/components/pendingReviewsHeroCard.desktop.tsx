"use client";

import { PendingActionsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
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
        gap: 2.5,
        height: "100%",
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: 2, flex: 1 }}>
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
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.75 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {labels.pendingReviewsHero(count)}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.pendingReviewsSubtitle}
          </Typography>
        </Stack>
      </Stack>
      {count > 0 ? (
        <DesktopPrimaryPageAction onClick={onGoToReviews} sx={{ alignSelf: "flex-start", mt: "auto" }}>
          {labels.goToReviews}
        </DesktopPrimaryPageAction>
      ) : null}
    </Box>
  );
}

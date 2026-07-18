"use client";

import { PendingActionsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import type { SupervisorDashboardLabels } from "@/shared/locale";

interface PendingReviewsHeroCardMobileProps {
  readonly count: number;
  readonly labels: SupervisorDashboardLabels;
  readonly onGoToReviews: () => void;
}

export function PendingReviewsHeroCardMobile({
  count,
  labels,
  onGoToReviews,
}: Readonly<PendingReviewsHeroCardMobileProps>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerHigh,
        borderRadius: theme.layout.radius.section,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          sx={theme => ({
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          <PendingActionsOutlined fontSize="small" />
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {labels.pendingReviewsHero(count)}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.pendingReviewsSubtitle}
          </Typography>
        </Stack>
      </Stack>
      {count > 0 ? (
        <MobilePrimaryPageAction onClick={onGoToReviews} sx={{ alignSelf: "flex-start" }}>
          {labels.goToReviews}
        </MobilePrimaryPageAction>
      ) : null}
    </Box>
  );
}

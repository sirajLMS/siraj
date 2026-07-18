"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import type { SupervisorDashboardLabels } from "@/shared/locale";

interface DuesSummaryCardDesktopProps {
  readonly summary: {
    readonly totalCount: number;
    readonly totalAmount: number;
    readonly currency: string;
  };
  readonly labels: SupervisorDashboardLabels;
  readonly onGoToDues: () => void;
}

export function DuesSummaryCardDesktop({ summary, labels, onGoToDues }: Readonly<DuesSummaryCardDesktopProps>) {
  const formattedAmount = `${summary.currency} ${summary.totalAmount.toLocaleString()}`;

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
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: 2 }}>
        <Box
          sx={theme => ({
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          <PaymentsOutlined fontSize="medium" />
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.75 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {labels.teacherDuesSummary}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.totalPendingDues}
          </Typography>
        </Stack>
      </Stack>

      <Stack sx={{ flexDirection: "row", alignItems: "flex-end", gap: 4, flex: 1 }}>
        <Stack sx={{ gap: 0.5, minWidth: 0 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.totalPendingDues}
          </Typography>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {formattedAmount}
          </Typography>
        </Stack>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, lineHeight: 1.33 })}>
          {String(summary.totalCount)}
        </Typography>
      </Stack>

      {summary.totalCount > 0 ? (
        <DesktopPrimaryPageAction onClick={onGoToDues} sx={{ alignSelf: "flex-start", mt: "auto" }}>
          {labels.goToDues}
        </DesktopPrimaryPageAction>
      ) : null}
    </Box>
  );
}

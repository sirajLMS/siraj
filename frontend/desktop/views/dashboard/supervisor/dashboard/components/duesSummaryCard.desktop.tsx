"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface, mb: 0.5 })}>
            {labels.teacherDuesSummary}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.totalPendingDues}
          </Typography>
        </Box>
      </Stack>
      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 0.5 })}>
            {labels.totalPendingDues}
          </Typography>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {formattedAmount}
          </Typography>
        </Box>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {String(summary.totalCount)}
        </Typography>
      </Stack>
      {summary.totalCount > 0 ? (
        <PrimaryPageAction onClick={onGoToDues} sx={{ alignSelf: "flex-start" }}>
          {labels.goToDues}
        </PrimaryPageAction>
      ) : null}
    </Box>
  );
}

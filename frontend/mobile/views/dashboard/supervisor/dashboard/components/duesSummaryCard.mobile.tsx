"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import type { SupervisorDashboardLabels } from "@/shared/locale";

interface DuesSummaryCardMobileProps {
  readonly summary: {
    readonly totalCount: number;
    readonly totalAmount: number;
    readonly currency: string;
  };
  readonly labels: SupervisorDashboardLabels;
  readonly onGoToDues: () => void;
}

export function DuesSummaryCardMobile({ summary, labels, onGoToDues }: Readonly<DuesSummaryCardMobileProps>) {
  const formattedAmount = `${summary.currency} ${summary.totalAmount.toLocaleString()}`;

  return (
    <Box
      sx={mergeSx(mobileContentGutterSx, theme => ({
        width: "100%",
        backgroundColor: theme.palette.surfaceContainerHigh,
        borderRadius: 0,
        py: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderTop: `1px solid ${theme.palette.outlineVariant}`,
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        borderLeft: "none",
        borderRight: "none",
        boxShadow: "none",
      }))}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          sx={theme => ({
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          <PaymentsOutlined fontSize="small" />
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {labels.teacherDuesSummary}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.totalPendingDues}
          </Typography>
        </Stack>
      </Stack>

      <Stack sx={{ flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
        <Stack sx={{ gap: 0.5, minWidth: 0 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.totalPendingDues}
          </Typography>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
            {formattedAmount}
          </Typography>
        </Stack>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 600 })}>
          {String(summary.totalCount)}
        </Typography>
      </Stack>

      {summary.totalCount > 0 ? (
        <MobilePrimaryPageAction onClick={onGoToDues} sx={{ alignSelf: "flex-start" }}>
          {labels.goToDues}
        </MobilePrimaryPageAction>
      ) : null}
    </Box>
  );
}

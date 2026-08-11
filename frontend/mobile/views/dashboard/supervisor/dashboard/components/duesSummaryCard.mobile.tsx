"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { SupervisorHeroCardShared } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/__shared__/supervisorHeroCardShared";
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
    <SupervisorHeroCardShared
      icon={<PaymentsOutlined fontSize="small" />}
      iconSx={theme => ({
        backgroundColor: theme.palette.secondaryContainer,
        color: theme.palette.onSecondaryContainer,
      })}
      title={labels.teacherDuesSummary}
      subtitle={labels.totalPendingDues}
      actionLabel={labels.goToDues}
      onAction={onGoToDues}
      showAction={summary.totalCount > 0}
    >
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
    </SupervisorHeroCardShared>
  );
}

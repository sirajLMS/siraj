"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { HeroSummaryCardShared } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared";
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
    <HeroSummaryCardShared
      icon={<PaymentsOutlined fontSize="medium" />}
      iconBgPaletteKey="secondaryContainer"
      title={labels.teacherDuesSummary}
      subtitle={labels.totalPendingDues}
      showAction={summary.totalCount > 0}
      actionLabel={labels.goToDues}
      onAction={onGoToDues}
    >
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
    </HeroSummaryCardShared>
  );
}

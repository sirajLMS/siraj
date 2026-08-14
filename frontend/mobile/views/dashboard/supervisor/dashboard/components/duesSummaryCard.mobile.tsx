"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { MOBILE_HERO_CARD_SX } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroCardSx.constants";
import { HeroSummaryCardShared } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared";
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
    <HeroSummaryCardShared
      icon={<PaymentsOutlined fontSize="small" />}
      iconBgPaletteKey="secondaryContainer"
      title={labels.teacherDuesSummary}
      subtitle={labels.totalPendingDues}
      actionLabel={labels.goToDues}
      onAction={onGoToDues}
      showAction={summary.totalCount > 0}
      PrimaryActionComponent={MobilePrimaryPageAction}
      cardSx={MOBILE_HERO_CARD_SX}
      iconCircleSize={40}
      stackGap={1.5}
      titleSubtitleGap={0.5}
      actionSx={{ alignSelf: "flex-start" }}
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
    </HeroSummaryCardShared>
  );
}

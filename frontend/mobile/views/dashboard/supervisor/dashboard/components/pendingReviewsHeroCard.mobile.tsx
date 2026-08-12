"use client";

import { PendingActionsOutlined } from "@mui/icons-material";
import { MOBILE_HERO_CARD_SX } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroCardSx.constants";
import { HeroSummaryCardShared } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared";
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
    <HeroSummaryCardShared
      icon={<PendingActionsOutlined fontSize="small" />}
      iconBgPaletteKey="primaryContainer"
      title={labels.pendingReviewsHero(count)}
      subtitle={labels.pendingReviewsSubtitle}
      actionLabel={labels.goToReviews}
      onAction={onGoToReviews}
      showAction={count > 0}
      PrimaryActionComponent={MobilePrimaryPageAction}
      cardSx={MOBILE_HERO_CARD_SX}
      iconCircleSize={40}
      stackGap={1.5}
      titleSubtitleGap={0.5}
      actionSx={{ alignSelf: "flex-start" }}
    />
  );
}

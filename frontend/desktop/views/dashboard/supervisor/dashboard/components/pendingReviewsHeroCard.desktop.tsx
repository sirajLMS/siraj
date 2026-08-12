"use client";

import { PendingActionsOutlined } from "@mui/icons-material";
import { HeroSummaryCardShared } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared";
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
    <HeroSummaryCardShared
      icon={<PendingActionsOutlined fontSize="medium" />}
      iconBgPaletteKey="primaryContainer"
      title={labels.pendingReviewsHero(count)}
      subtitle={labels.pendingReviewsSubtitle}
      showAction={count > 0}
      actionLabel={labels.goToReviews}
      onAction={onGoToReviews}
      PrimaryActionComponent={DesktopPrimaryPageAction}
    />
  );
}

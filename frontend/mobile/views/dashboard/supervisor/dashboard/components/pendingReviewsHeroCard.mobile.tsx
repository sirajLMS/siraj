"use client";

import { PendingActionsOutlined } from "@mui/icons-material";
import { SupervisorHeroCardShared } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/__shared__/supervisorHeroCardShared";
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
    <SupervisorHeroCardShared
      icon={<PendingActionsOutlined fontSize="small" />}
      iconSx={theme => ({
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.onPrimaryContainer,
      })}
      title={labels.pendingReviewsHero(count)}
      subtitle={labels.pendingReviewsSubtitle}
      actionLabel={labels.goToReviews}
      onAction={onGoToReviews}
      showAction={count > 0}
    />
  );
}

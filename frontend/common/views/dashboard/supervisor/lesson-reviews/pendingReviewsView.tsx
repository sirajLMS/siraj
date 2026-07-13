"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type PendingReviewsViewModel,
  type UsePendingReviewsViewModelProps,
  usePendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel";

export type { PendingReviewsViewModel };

const lazyViews = createLazyView<PendingReviewsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/pendingReviews.mobile").then(m => ({
      default: m.PendingReviewsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviews.desktop").then(m => ({
      default: m.PendingReviewsDesktopView,
    }))
);

export function PendingReviewsView(props: Readonly<UsePendingReviewsViewModelProps>) {
  const viewModel = usePendingReviewsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

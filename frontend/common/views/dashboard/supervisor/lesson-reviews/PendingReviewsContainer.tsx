"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { SnackbarContainer } from "@/frontend/common/components/ui/container/SnackbarContainer";
import {
  type PendingReviewsViewModel,
  usePendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel";

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

export function PendingReviewsContainer() {
  const viewModel = usePendingReviewsViewModel({});

  return <SnackbarContainer viewModel={viewModel} mobile={lazyViews.mobile} desktop={lazyViews.desktop} />;
}

"use client";

import { Alert, Snackbar } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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

  return (
    <RequirePermission
      permissions={[AppPermission.LessonReportsReview, AppPermission.LessonReportsApprove]}
      fallback={null}
    >
      <Snackbar
        open={viewModel.snackbar.open}
        autoHideDuration={4000}
        onClose={viewModel.onCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={viewModel.snackbar.severity} onClose={viewModel.onCloseSnackbar} sx={{ width: "100%" }}>
          {viewModel.snackbar.message}
        </Alert>
      </Snackbar>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { PendingReviewsViewModel };

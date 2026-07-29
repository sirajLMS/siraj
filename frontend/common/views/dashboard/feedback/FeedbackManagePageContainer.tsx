"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { FeedbackManageView } from "@/frontend/common/views/dashboard/feedback/FeedbackManageView";
import { useFeedbackManageTabsViewModel } from "@/frontend/common/views/dashboard/feedback/tabs/useFeedbackManageTabsViewModel";

export function FeedbackManagePageContainer() {
  const viewModel = useFeedbackManageTabsViewModel();
  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.feedbackManageParent} fallback={null}>
      <FeedbackManageView {...viewModel} />
    </RequirePermission>
  );
}

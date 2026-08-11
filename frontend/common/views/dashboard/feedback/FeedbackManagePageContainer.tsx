"use client";

import { FeedbackManageView } from "@/frontend/common/views/dashboard/feedback/FeedbackManageView";
import { useFeedbackManageTabsViewModel } from "@/frontend/common/views/dashboard/feedback/tabs/useFeedbackManageTabsViewModel";

export function FeedbackManagePageContainer() {
  const viewModel = useFeedbackManageTabsViewModel();
  return <FeedbackManageView {...viewModel} />;
}

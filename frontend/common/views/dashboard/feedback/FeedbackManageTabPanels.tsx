"use client";

import { useFeedbackManageTabsStore } from "@/frontend/common/stores/feedbackManageTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import {
  LazyComplaintsTab,
  LazySuggestionsTab,
} from "@/frontend/common/views/dashboard/feedback/FeedbackManageTabPanels.lazy";
import type { FeedbackManageTabId } from "@/frontend/common/views/dashboard/feedback/tabs/types";
import { createTabbedPanePanels } from "@/frontend/common/views/dashboard/lib/createTabbedPanePanels";

export const FeedbackManageTabPanels = createTabbedPanePanels<FeedbackManageTabId>({
  useVisitedTabs: () => useFeedbackManageTabsStore(state => state.visitedTabs),
  ariaIdPrefix: "feedback-manage",
  panels: [
    { id: "complaints", permissions: PAGE_PERMISSIONS.feedbackComplaints, Component: LazyComplaintsTab },
    { id: "suggestions", permissions: PAGE_PERMISSIONS.feedbackSuggestions, Component: LazySuggestionsTab },
  ],
});

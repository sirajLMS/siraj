"use client";

import { useMemo } from "react";
import { useFeedbackManageTabsStore } from "@/frontend/common/stores/feedbackManageTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisibleFeedbackManageTabs } from "@/frontend/common/views/dashboard/feedback/tabs/config/feedbackManageTabs.config";
import type {
  FeedbackManageTabId,
  FeedbackManageTabLabelKey,
  FeedbackManageTabsViewModel,
  FeedbackManageViewLabels,
} from "@/frontend/common/views/dashboard/feedback/tabs/types";
import { useTabbedPane } from "@/frontend/common/views/dashboard/lib/useTabbedPane";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { FeedbackManageTabsViewModel };

export function useFeedbackManageTabsViewModel(): FeedbackManageTabsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.FeedbackManageParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useFeedbackManageTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleFeedbackManageTabs(hasPermission), [hasPermission]);

  const viewLabels: FeedbackManageViewLabels = useMemo(
    () => ({ title: labels.pageTitle, subtitle: labels.pageSubtitle, tabs: labels.tabs }),
    [labels]
  );

  return useTabbedPane<FeedbackManageTabId, FeedbackManageTabLabelKey, FeedbackManageViewLabels>({
    visibleTabs,
    defaultTabId: "complaints",
    markTabVisited,
    viewLabels,
    labelFor: key => labels.tabs[key],
  });
}

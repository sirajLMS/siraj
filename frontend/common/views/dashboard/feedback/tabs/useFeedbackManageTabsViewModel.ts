"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useFeedbackManageTabsStore } from "@/frontend/common/stores/feedbackManageTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisibleFeedbackManageTabs } from "@/frontend/common/views/dashboard/feedback/tabs/config/feedbackManageTabs.config";
import type {
  FeedbackManageTabId,
  FeedbackManageTabLabelKey,
  FeedbackManageTabsViewModel,
  FeedbackManageViewLabels,
} from "@/frontend/common/views/dashboard/feedback/tabs/types";
import { buildTabHref, buildTabNavItems, resolveTab } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { FeedbackManageTabsViewModel };

export function useFeedbackManageTabsViewModel(): FeedbackManageTabsViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = useAppTranslation(Translation.Dashboard.FeedbackManageParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useFeedbackManageTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleFeedbackManageTabs(hasPermission), [hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab =
    resolveTab<FeedbackManageTabId, FeedbackManageTabLabelKey>(tabParam, visibleTabs) ?? "complaints";

  useEffect(() => {
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const viewLabels: FeedbackManageViewLabels = useMemo(
    () => ({ title: labels.pageTitle, subtitle: labels.pageSubtitle, tabs: labels.tabs }),
    [labels]
  );

  const tabNavItems = useMemo(
    () =>
      buildTabNavItems<FeedbackManageTabId, FeedbackManageTabLabelKey, FeedbackManageViewLabels>({
        labels: viewLabels,
        visibleTabs,
        activeTab: resolvedActiveTab,
        pathname,
        searchParams,
        labelFor: key => labels.tabs[key],
      }),
    [visibleTabs, labels.tabs, viewLabels, resolvedActiveTab, pathname, searchParams]
  );

  return { labels: viewLabels, activeTab: resolvedActiveTab, tabNavItems };
}

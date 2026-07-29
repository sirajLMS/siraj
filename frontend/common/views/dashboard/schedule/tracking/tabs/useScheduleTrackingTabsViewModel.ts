"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useScheduleTrackingTabsStore } from "@/frontend/common/stores/scheduleTrackingTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { buildTabHref, buildTabNavItems, resolveTab } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { getVisibleScheduleTrackingTabs } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/config/scheduleTrackingTabs.config";
import type {
  ScheduleTrackingTabId,
  ScheduleTrackingTabLabelKey,
  ScheduleTrackingTabsViewModel,
  ScheduleTrackingViewLabels,
} from "@/frontend/common/views/dashboard/schedule/tracking/tabs/types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { ScheduleTrackingTabsViewModel };

export function useScheduleTrackingTabsViewModel(): ScheduleTrackingTabsViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = useAppTranslation(Translation.Dashboard.ScheduleTrackingParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useScheduleTrackingTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleScheduleTrackingTabs(hasPermission), [hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab =
    resolveTab<ScheduleTrackingTabId, ScheduleTrackingTabLabelKey>(tabParam, visibleTabs) ?? "reschedule";

  useEffect(() => {
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const viewLabels: ScheduleTrackingViewLabels = useMemo(
    () => ({
      title: labels.pageTitle,
      subtitle: labels.pageSubtitle,
      tabs: labels.tabs,
    }),
    [labels]
  );

  const tabNavItems = useMemo(
    () =>
      buildTabNavItems<ScheduleTrackingTabId, ScheduleTrackingTabLabelKey, ScheduleTrackingViewLabels>({
        labels: viewLabels,
        visibleTabs,
        activeTab: resolvedActiveTab,
        pathname,
        searchParams,
        labelFor: key => labels.tabs[key],
      }),
    [visibleTabs, labels.tabs, viewLabels, resolvedActiveTab, pathname, searchParams]
  );

  return {
    labels: viewLabels,
    activeTab: resolvedActiveTab,
    tabNavItems,
  };
}

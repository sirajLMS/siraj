"use client";

import { useMemo } from "react";
import { useScheduleTrackingTabsStore } from "@/frontend/common/stores/scheduleTrackingTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useTabbedPane } from "@/frontend/common/views/dashboard/lib/useTabbedPane";
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
  const labels = useAppTranslation(Translation.Dashboard.ScheduleTrackingParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useScheduleTrackingTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleScheduleTrackingTabs(hasPermission), [hasPermission]);

  const viewLabels: ScheduleTrackingViewLabels = useMemo(
    () => ({
      title: labels.pageTitle,
      subtitle: labels.pageSubtitle,
      tabs: labels.tabs,
    }),
    [labels]
  );

  return useTabbedPane<ScheduleTrackingTabId, ScheduleTrackingTabLabelKey, ScheduleTrackingViewLabels>({
    visibleTabs,
    defaultTabId: "reschedule",
    markTabVisited,
    viewLabels,
    labelFor: key => labels.tabs[key],
  });
}

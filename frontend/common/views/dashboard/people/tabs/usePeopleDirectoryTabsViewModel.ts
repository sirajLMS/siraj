"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { usePeopleDirectoryTabsStore } from "@/frontend/common/stores/peopleDirectoryTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { buildTabHref, buildTabNavItems, resolveTab } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { getVisiblePeopleDirectoryTabs } from "@/frontend/common/views/dashboard/people/tabs/config/peopleDirectoryTabs.config";
import type {
  PeopleDirectoryTabId,
  PeopleDirectoryTabLabelKey,
  PeopleDirectoryTabsViewModel,
  PeopleDirectoryViewLabels,
} from "@/frontend/common/views/dashboard/people/tabs/types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PeopleDirectoryTabsViewModel };

export function usePeopleDirectoryTabsViewModel(): PeopleDirectoryTabsViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = useAppTranslation(Translation.Dashboard.PeopleDirectoryParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = usePeopleDirectoryTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisiblePeopleDirectoryTabs(hasPermission), [hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab =
    resolveTab<PeopleDirectoryTabId, PeopleDirectoryTabLabelKey>(tabParam, visibleTabs) ?? "teachers";

  useEffect(() => {
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) return;
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const viewLabels: PeopleDirectoryViewLabels = useMemo(
    () => ({ title: labels.pageTitle, subtitle: labels.pageSubtitle, tabs: labels.tabs }),
    [labels]
  );

  const tabNavItems = useMemo(
    () =>
      buildTabNavItems<PeopleDirectoryTabId, PeopleDirectoryTabLabelKey, PeopleDirectoryViewLabels>({
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

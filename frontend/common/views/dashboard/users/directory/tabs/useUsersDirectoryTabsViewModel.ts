"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useUsersDirectoryTabsStore } from "@/frontend/common/stores/usersDirectoryTabsStore";
import { buildTabHref, buildTabNavItems, resolveTab } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { getVisibleUsersDirectoryTabs } from "@/frontend/common/views/dashboard/users/directory/tabs/config/usersDirectoryTabs.config";
import type {
  UsersDirectoryTabId,
  UsersDirectoryTabLabelKey,
  UsersDirectoryTabsViewModel,
  UsersDirectoryViewLabels,
} from "@/frontend/common/views/dashboard/users/directory/tabs/types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { UsersDirectoryTabsViewModel };

export function useUsersDirectoryTabsViewModel(): UsersDirectoryTabsViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = useAppTranslation(Translation.Dashboard.UsersDirectoryParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useUsersDirectoryTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleUsersDirectoryTabs(hasPermission), [hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab =
    resolveTab<UsersDirectoryTabId, UsersDirectoryTabLabelKey>(tabParam, visibleTabs) ?? "teachers";

  useEffect(() => {
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) return;
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const viewLabels: UsersDirectoryViewLabels = useMemo(
    () => ({ title: labels.pageTitle, subtitle: labels.pageSubtitle, tabs: labels.tabs }),
    [labels]
  );

  const tabNavItems = useMemo(
    () =>
      buildTabNavItems<UsersDirectoryTabId, UsersDirectoryTabLabelKey, UsersDirectoryViewLabels>({
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

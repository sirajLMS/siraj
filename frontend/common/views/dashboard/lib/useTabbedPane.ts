"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  buildTabHref,
  buildTabNavItems,
  resolveTab,
  type TabDefinition,
  type TabNavItem,
} from "@/frontend/common/views/dashboard/lib/tabbedPane";

export interface UseTabbedPaneOptions<TabId extends string, TabLabelKey extends string, ViewLabels> {
  readonly visibleTabs: readonly TabDefinition<TabId, TabLabelKey>[];
  readonly defaultTabId: TabId;
  readonly markTabVisited: (tabId: TabId) => void;
  readonly viewLabels: ViewLabels;
  readonly labelFor: (key: TabLabelKey) => string;
}

export interface UseTabbedPaneResult<TabId extends string, ViewLabels> {
  readonly labels: ViewLabels;
  readonly activeTab: TabId;
  readonly tabNavItems: readonly TabNavItem<TabId>[];
}

export function useTabbedPane<TabId extends string, TabLabelKey extends string, ViewLabels>(
  options: UseTabbedPaneOptions<TabId, TabLabelKey, ViewLabels>
): UseTabbedPaneResult<TabId, ViewLabels> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { markTabVisited, visibleTabs, viewLabels, labelFor, defaultTabId } = options;
  const resolvedActiveTab = resolveTab<TabId, TabLabelKey>(tabParam, visibleTabs) ?? defaultTabId;

  useEffect(() => {
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const tabNavItems = useMemo(
    () =>
      buildTabNavItems<TabId, TabLabelKey, ViewLabels>({
        labels: viewLabels,
        visibleTabs,
        activeTab: resolvedActiveTab,
        pathname,
        searchParams,
        labelFor,
      }),
    [viewLabels, visibleTabs, resolvedActiveTab, pathname, searchParams, labelFor]
  );

  return { labels: viewLabels, activeTab: resolvedActiveTab, tabNavItems };
}

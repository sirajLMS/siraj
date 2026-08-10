"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildTabHref,
  getVisibleTabs,
  resolveTab,
  type TabbedPaneViewModel,
  type TabDefinition,
  type TabNavItem,
} from "@/frontend/common/views/dashboard/lib/tabbedPane";

/**
 * Factory hook that builds a tabbed-parent ViewModel for any domain.
 * Replicates `useSettingsViewModel` exactly, but accepts a per-domain
 * "tabs config" + a translation hook + the per-domain Zustand "markTabVisited".
 *
 * Per-domain Caller pattern:
 *
 *   export function useBillingTabsViewModel() {
 *     const t = useAppTranslation(Translation.Dashboard.BillingTabs);
 *     const markTabVisited = useBillingTabsStore(s => s.markTabVisited);
 *     return useTabbedPaneViewModel<BillingTabId, BillingTabLabelsKey, BillingLabels>({
 *       labelFor: (key) => t[key],
 *       allTabs: BILLING_TABS,
 *       markTabVisited,
 *       pageLabels: t,
 *     });
 *   }
 *
 * TIL: `markTabVisited` is passed by the caller (rather than imported here)
 * so the zustand hook is called inside the caller — preserving React's
 * rules-of-hooks ordering and keeping this factory fully domain-agnostic.
 */

export interface UseTabbedPaneViewModelOptions<TabId extends string, LabelKey extends string, Labels> {
  /** Translation lookup — given a `labelKey` returns the translated string. */
  readonly labelFor: (labelKey: LabelKey) => string;
  /** All tab definitions — not yet permission-filtered. */
  readonly allTabs: readonly TabDefinition<TabId, LabelKey>[];
  /** Stable action that flips a tab's "visited" flag in the per-domain store. */
  readonly markTabVisited: (tab: TabId) => void;
  /** Optional fallback tab id (defaults to the first visible tab). */
  readonly fallbackTab?: TabId;
  /** Page-level labels joined into the ViewModel (the chrome renders them). */
  readonly pageLabels: Labels;
  /**
   * Custom `hasPermission` hook (defaults to the global `useUserStore`).
   * Allows Callers to layer additional logic (e.g. superadmin overrides)
   * without re-implementing the whole hook.
   */
  readonly hasPermission?: (permission: AppPermission) => boolean;
}

export function useTabbedPaneViewModel<TabId extends string, LabelKey extends string, Labels = unknown>(
  options: UseTabbedPaneViewModelOptions<TabId, LabelKey, Labels>
): TabbedPaneViewModel<TabId, Labels> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultHasPermission = useUserStore(state => state.hasPermission);
  const hasPermission = options.hasPermission ?? defaultHasPermission;

  const visibleTabs = useMemo(() => getVisibleTabs(options.allTabs, hasPermission), [options.allTabs, hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab = resolveTab(tabParam, visibleTabs) ?? options.fallbackTab ?? visibleTabs[0]?.id;

  const { markTabVisited } = options;
  useEffect(() => {
    if (!resolvedActiveTab) {
      return;
    }
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const labelFor = options.labelFor;
  const tabNavItems = useMemo(
    (): readonly TabNavItem<TabId>[] =>
      visibleTabs.map(tab => ({
        id: tab.id,
        label: labelFor(tab.labelKey),
        href: buildTabHref(pathname, searchParams, tab.id),
      })),
    [visibleTabs, labelFor, pathname, searchParams]
  );

  return {
    labels: options.pageLabels,
    activeTab: resolvedActiveTab,
    tabNavItems,
  };
}

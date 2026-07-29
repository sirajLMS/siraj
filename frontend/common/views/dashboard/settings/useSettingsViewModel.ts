"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisibleSettingsTabs } from "@/frontend/common/views/dashboard/settings/config/settingsTabs.config";
import type { SettingsTabId } from "@/frontend/common/views/dashboard/settings/types/settings.types";
import type { SettingsTabNavItem } from "@/frontend/common/views/dashboard/settings/types/settingsTabNav.types";
import {
  buildSettingsTabHref,
  resolveSettingsTab,
} from "@/frontend/common/views/dashboard/settings/utils/settingsTabUrl";
import { type SettingsLabels, Translation, useAppTranslation } from "@/shared/locale";

export type SettingsViewModel = {
  readonly labels: SettingsLabels;
  readonly activeTab: SettingsTabId;
  readonly tabNavItems: readonly SettingsTabNavItem[];
};

export function useSettingsViewModel(): SettingsViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = useAppTranslation(Translation.Dashboard.Settings);
  const hasPermission = useUserStore(state => state.hasPermission);

  const visibleTabs = useMemo(() => getVisibleSettingsTabs(hasPermission), [hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab = resolveSettingsTab(tabParam, visibleTabs) ?? "general";

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) {
      return;
    }
    router.replace(buildSettingsTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const tabNavItems = useMemo(
    (): SettingsTabNavItem[] =>
      visibleTabs.map(tab => ({
        id: tab.id,
        label: labels.tabs[tab.labelKey],
        href: buildSettingsTabHref(pathname, searchParams, tab.id),
      })),
    [visibleTabs, labels.tabs, pathname, searchParams]
  );

  return {
    labels,
    activeTab: resolvedActiveTab,
    tabNavItems,
  };
}

import type {
  SettingsTabDefinition,
  SettingsTabId,
} from "@/frontend/common/views/dashboard/settings/types/settings.types";

const SETTINGS_TAB_IDS: readonly SettingsTabId[] = [
  "general",
  "environment",
  "session",
  "audit",
  "siteContent",
  "timezones",
] as const;

export function isSettingsTabId(value: string): value is SettingsTabId {
  return (SETTINGS_TAB_IDS as readonly string[]).includes(value);
}

export function buildSettingsTabHref(pathname: string, searchParams: URLSearchParams, tab: SettingsTabId): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("tab", tab);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function resolveSettingsTab(
  tabParam: string | null,
  availableTabs: readonly SettingsTabDefinition[]
): SettingsTabId | undefined {
  if (tabParam && isSettingsTabId(tabParam) && availableTabs.some(tab => tab.id === tabParam)) {
    return tabParam;
  }
  return availableTabs[0]?.id;
}

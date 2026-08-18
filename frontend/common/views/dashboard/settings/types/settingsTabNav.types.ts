import type { SettingsTabId } from "@/frontend/common/views/dashboard/settings/types/settings.types";

export type SettingsTabNavItem = {
  readonly id: SettingsTabId;
  readonly label: string;
  readonly href: string;
};

export type SettingsTabNavVariantProps = {
  readonly activeTab: SettingsTabId;
  readonly tabs: readonly SettingsTabNavItem[];
  readonly ariaLabel: string;
};

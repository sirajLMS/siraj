import type { PagePermissions } from "@/frontend/common/types/page-permissions.types";
import type { SettingsLabels } from "@/shared/locale/types/dashboard/settings";

export type SettingsTabId =
  | "general"
  | "environment"
  | "session"
  | "audit"
  | "siteContent"
  | "timezones"
  | "meetingIntegrations";

export type SettingsTabLabelKey = keyof SettingsLabels["tabs"];

export type SettingsTabDefinition = {
  readonly id: SettingsTabId;
  readonly labelKey: SettingsTabLabelKey;
  readonly permissions: PagePermissions;
  readonly icon: import("@mui/icons-material").SvgIconComponent;
};

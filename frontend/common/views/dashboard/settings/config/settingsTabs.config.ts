import {
  ArticleOutlined,
  HistoryOutlined,
  LanguageOutlined,
  PublicOutlined,
  ScheduleOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { SettingsTabDefinition } from "@/frontend/common/views/dashboard/settings/types/settings.types";

export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
  {
    id: "general",
    labelKey: "general",
    permissions: PAGE_PERMISSIONS.settingsGeneral,
    icon: SettingsOutlined,
  },
  {
    id: "environment",
    labelKey: "environment",
    permissions: PAGE_PERMISSIONS.settingsEnvironment,
    icon: PublicOutlined,
  },
  {
    id: "session",
    labelKey: "session",
    permissions: PAGE_PERMISSIONS.settingsSession,
    icon: ScheduleOutlined,
  },
  {
    id: "audit",
    labelKey: "audit",
    permissions: PAGE_PERMISSIONS.settingsAudit,
    icon: HistoryOutlined,
  },
  {
    id: "siteContent",
    labelKey: "siteContent",
    permissions: PAGE_PERMISSIONS.settingsSiteContent,
    icon: ArticleOutlined,
  },
  {
    id: "timezones",
    labelKey: "timezones",
    permissions: PAGE_PERMISSIONS.settingsTimezones,
    icon: LanguageOutlined,
  },
] as const;

export function getVisibleSettingsTabs(hasPermission: (permission: AppPermission) => boolean): SettingsTabDefinition[] {
  return SETTINGS_TABS.filter(tab => tab.permissions.some(permission => hasPermission(permission)));
}

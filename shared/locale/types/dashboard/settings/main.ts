import type { SettingsEnvironmentLabels } from "@/shared/locale/types/dashboard/settings/environment";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";
import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";
import type { SettingsTimezonesLabels } from "@/shared/locale/types/dashboard/settings/timezones";

export interface SettingsAuditLabels {
  readonly emptyMessage: string;
  readonly filters: {
    readonly entityType: string;
    readonly action: string;
    readonly dateRange: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly all: string;
  };
  readonly columns: {
    readonly createdAt: string;
    readonly entityType: string;
    readonly action: string;
    readonly description: string;
    readonly actor: string;
    readonly entityId: string;
  };
  readonly entityTypes: Record<string, string>;
  readonly actions: Record<string, string>;
}

export interface SettingsLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly comingSoon: string;
  readonly tabs: {
    readonly general: string;
    readonly environment: string;
    readonly session: string;
    readonly audit: string;
    readonly siteContent: string;
    readonly timezones: string;
  };
  readonly audit: SettingsAuditLabels;
  readonly environment: SettingsEnvironmentLabels;
  readonly general: SettingsGeneralTabLabels;
  readonly session: SettingsSessionTabLabels;
  readonly siteContent: SettingsSiteContentTabLabels;
  readonly timezones: SettingsTimezonesLabels;
}

import type { GeneralSettingDefinition } from "@/shared/constants/settings/generalSettings.constants";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

export type SystemSettingRow = GeneralSettingDefinition & {
  readonly value: string;
  readonly isFromDb: boolean;
  readonly updatedByUserId: string | null;
  readonly updatedAt: string | null;
};

export interface GeneralSettingsViewModel {
  readonly rows: readonly SystemSettingRow[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly labels: SettingsGeneralTabLabels;
  readonly savingCode: string | null;
  readonly onValueChange: (code: string, value: string) => Promise<void>;
}

export type UseGeneralSettingsViewModelProps = Record<string, never>;

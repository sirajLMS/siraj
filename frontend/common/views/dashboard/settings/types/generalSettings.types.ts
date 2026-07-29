import type {
  SystemSettingCategory,
  SystemSettingDataType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

export type SystemSettingRow = {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly dataType: SystemSettingDataType;
  readonly description: string;
  readonly category: SystemSettingCategory;
  readonly updatedByUserId: string | null;
  readonly updatedAt: string | null;
};

export interface GeneralSettingsViewModel {
  readonly rows: readonly SystemSettingRow[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly labels: SettingsGeneralTabLabels;
  readonly formOpen: boolean;
  readonly editRow: SystemSettingRow | null;
  readonly deleteRow: SystemSettingRow | null;
  readonly isDeleting: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (row: SystemSettingRow) => void;
  readonly onDelete: (row: SystemSettingRow) => void;
  readonly onFormClose: () => void;
  readonly onDeleteClose: () => void;
  readonly onSaved: () => Promise<void>;
  readonly onConfirmDelete: () => Promise<void>;
}

export type UseGeneralSettingsViewModelProps = Record<string, never>;

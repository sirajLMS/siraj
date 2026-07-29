export type SystemSettingDataTypeKey = "string" | "integer" | "boolean" | "json";

export type SystemSettingCategoryKey =
  | "security"
  | "system"
  | "scheduling"
  | "communication"
  | "email"
  | "sms"
  | "push"
  | "fx"
  | "cache"
  | "redis"
  | "storage"
  | "auth"
  | "app"
  | "meeting"
  | "billing"
  | "general";

export interface SettingsGeneralTabLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly empty: string;
  readonly addLabel: string;
  readonly keyColumn: string;
  readonly valueColumn: string;
  readonly dataTypeColumn: string;
  readonly descriptionColumn: string;
  readonly categoryColumn: string;
  readonly updatedAtColumn: string;
  readonly actionsColumn: string;
  readonly editLabel: string;
  readonly deleteLabel: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly keyField: string;
  readonly valueField: string;
  readonly dataTypeField: string;
  readonly descriptionField: string;
  readonly categoryField: string;
  readonly dataTypeString: string;
  readonly dataTypeInteger: string;
  readonly dataTypeBoolean: string;
  readonly dataTypeJson: string;
  readonly keyRequired: string;
  readonly valueRequired: string;
  readonly valueInteger: string;
  readonly valueBoolean: string;
  readonly valueJson: string;
  readonly saveLabel: string;
  readonly cancelLabel: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly deleteConfirmTitle: string;
  readonly deleteConfirmBody: (key: string) => string;
  readonly deleteConfirmCancel: string;
  readonly deleteConfirmConfirm: string;
  readonly deleteSuccess: string;
  readonly deleteError: string;
  readonly categories: Record<SystemSettingCategoryKey, string>;
  readonly dataTypeLabels: Record<SystemSettingDataTypeKey, string>;
}

export type SettingsEnvironmentCategoryKey =
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

export interface SettingsEnvironmentLabels {
  readonly description: string;
  readonly loading: string;
  readonly loadError: string;
  readonly emptyValue: string;
  readonly readOnlyHint: string;
  readonly columns: {
    readonly key: string;
    readonly description: string;
    readonly value: string;
    readonly source: string;
  };
  readonly source: {
    readonly db: string;
    readonly env: string;
    readonly unset: string;
  };
  readonly badges: {
    readonly dbOverride: string;
    readonly envOnly: string;
  };
  readonly actions: {
    readonly save: string;
    readonly revert: string;
    readonly showValue: string;
    readonly hideValue: string;
  };
  readonly notifications: {
    readonly saveSuccess: string;
    readonly saveError: string;
    readonly revertSuccess: string;
    readonly revertError: string;
  };
  readonly categories: Record<SettingsEnvironmentCategoryKey, string>;
}
